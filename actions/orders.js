'use server'

import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import PendingOrder from '@/models/PendingOrder';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import Address from '@/models/Address';
import User from '@/models/User';
import Settings from '@/models/Settings';
import GlobalSetting from '@/models/GlobalSetting';
import OrderAttempt from '@/models/OrderAttempt';
import Tag from '@/models/Tag';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateCart } from './cart';
import { assertAdmin, assertSession, isValidObjectId, sanitizeString } from '@/lib/security';
import { getRequestMeta } from '@/lib/getRequestMeta';
import { isBlocked, trackAttempt } from '@/actions/security';
import { trackUserActivity } from '@/lib/trackUserActivity';

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// ─── ORDER PROTECTION: block + rate-limit check ───────────────────────────────
// Returns an error string if the request should be rejected, null if OK.
async function checkOrderProtection(ip, deviceId, userId) {
  // 1. Block list check
  if (await isBlocked(ip, deviceId, userId)) {
    return 'Your account or device has been restricted due to suspicious activity. Please contact support.';
  }

  // 2. Rate limit: max 10 order/pending-order attempts per IP in 1 hour
  const window1h = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await OrderAttempt.countDocuments({
    ip,
    type: { $in: ['order_created', 'pending_created', 'stock_fail'] },
    createdAt: { $gte: window1h },
  });
  if (recentCount >= 10) {
    return 'Too many order attempts from your network. Please try again in an hour.';
  }

  // 3. Device rate limit: max 5 per device per hour (catches multi-account from same browser)
  if (deviceId) {
    const deviceCount = await OrderAttempt.countDocuments({
      deviceId,
      type: { $in: ['order_created', 'pending_created', 'stock_fail'] },
      createdAt: { $gte: window1h },
    });
    if (deviceCount >= 5) {
      return 'Too many order attempts from this device. Please try again in an hour.';
    }
  }

  return null;
}

// ─── STOCK RESERVATION HELPERS ───────────────────────────────────────────────

// Atomically decrements stock for each item. If any item is out of stock,
// rolls back all previous decrements and returns an error.
// items must have: { _id (productId), name, size/selectedSize, quantity }
async function reserveStock(items) {
  const reserved = [];
  for (const item of items) {
    const qty  = item.quantity;
    const size = item.selectedSize || item.size;
    const hasSize = size && size !== 'STD' && size !== 'Standard';
    let updated;
    if (hasSize) {
      updated = await Product.findOneAndUpdate(
        { _id: item._id, variants: { $elemMatch: { size, stock: { $gte: qty } } } },
        { $inc: { 'variants.$.stock': -qty, stock: -qty } }
      );
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: item._id, stock: { $gte: qty } },
        { $inc: { stock: -qty } }
      );
    }
    if (!updated) {
      await releaseStockItems(reserved);
      const label = hasSize ? `Size ${size} of "${item.name}"` : `"${item.name}"`;
      return { error: `${label} just sold out. Please update your cart.` };
    }
    reserved.push({ _id: item._id, name: item.name, size, quantity: qty, hasSize });
  }
  return { success: true };
}

// Releases (restores) stock — used for rollback and abandoned-payment cleanup.
// items must have: { _id or product (productId), size, quantity, hasSize? }
async function releaseStockItems(items) {
  for (const item of items) {
    const productId = item._id || item.product;
    const qty  = item.quantity;
    const size = item.size;
    const hasSize = item.hasSize ?? (size && size !== 'STD' && size !== 'Standard');
    if (hasSize) {
      await Product.updateOne(
        { _id: productId, 'variants.size': size },
        { $inc: { 'variants.$.stock': qty, stock: qty } }
      );
    } else {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
    }
  }
}

// ─── INVOICE COUNTER ─────────────────────────────────────────────────────────

// Atomically returns the next invoice sequence for the given year.
// Uses a pipeline update (MongoDB 4.2+) to do max(counter, dbMax)+1 in one
// atomic operation — safe against concurrent requests AND a stale counter.
async function nextInvoiceSeq(year) {
  const last = await Order.findOne(
    { invoiceNumber: { $regex: `^INV-${year}-` } },
    { invoiceNumber: 1 }
  ).sort({ invoiceNumber: -1 }).lean();

  const maxSeq = last?.invoiceNumber
    ? (parseInt(last.invoiceNumber.split('-')[2], 10) || 0)
    : 0;

  // Single atomic op: value = max(current_value, maxSeq) + 1
  // $ifNull handles the case where the document is being upserted (value doesn't exist yet)
  const doc = await GlobalSetting.findOneAndUpdate(
    { identifier: `invoice_seq_${year}` },
    [{ $set: { value: { $add: [{ $max: [{ $ifNull: ['$value', 0] }, maxSeq] }, 1] } } }],
    { new: true, upsert: true }
  );

  return doc.value;
}

const ALLOWED_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// ─── ADDRESS ACTIONS ──────────────────────────────────────────────────────────
export async function getSavedAddresses() {
  let session;
  try { session = await assertSession(); } catch { return []; }
  await connectDB();

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  if (!userId) return [];

  const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return serialize(addresses);
}

export async function saveAddress(formData) {
  let session;
  try { session = await assertSession(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  if (!userId) return { error: 'Unauthorized' };

  const firstName = sanitizeString(formData.get('firstName'), 50);
  const lastName = sanitizeString(formData.get('lastName'), 50);
  const phone = sanitizeString(formData.get('phone'), 20);
  const address = sanitizeString(formData.get('address'), 300);
  const city = sanitizeString(formData.get('city'), 100);
  const postalCode = sanitizeString(formData.get('postalCode'), 20);

  if (!firstName || !phone || !address || !city) {
    return { error: 'All required fields must be filled' };
  }

  try {
    await Address.create({
      user: userId,
      label: sanitizeString(formData.get('label'), 50) || 'Home',
      firstName, lastName, phone, address, city, postalCode,
    });
    revalidatePath('/checkout');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to save address' };
  }
}

// ─── COUPON ACTIONS (admin-only writes) ───────────────────────────────────────
export async function createCoupon(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  try {
    const isAutomatic = formData.get('isAutomatic') === 'true';
    let code = sanitizeString(formData.get('code'), 50)?.toUpperCase();
    if (isAutomatic && !code) code = `AUTO-${Date.now()}`;
    if (!code) return { error: 'Coupon code is required' };

    const discountValue = Number(formData.get('discountValue'));
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100000) {
      return { error: 'Invalid discount value' };
    }

    const discountType = formData.get('discountType');
    if (!['percentage', 'fixed'].includes(discountType)) return { error: 'Invalid discount type' };
    if (discountType === 'percentage' && discountValue > 100) return { error: 'Percentage cannot exceed 100' };

    const validUntilRaw = formData.get('validUntil');
    const validUntil = new Date(validUntilRaw);
    if (isNaN(validUntil.getTime()) || validUntil < new Date()) {
      return { error: 'Valid expiry date required' };
    }

    const categories = formData.getAll('categories').filter(isValidObjectId);
    const products = formData.getAll('products').filter(isValidObjectId);

    await Coupon.create({
      code,
      description: sanitizeString(formData.get('description'), 500),
      isAutomatic,
      discountType,
      discountValue,
      minSpend: Math.max(0, Number(formData.get('minSpend') || 0)),
      minQuantity: Math.max(0, Number(formData.get('minQuantity') || 0)),
      validUntil,
      usageLimit: Math.max(1, Number(formData.get('usageLimit') || 10000)),
      applicableCategories: categories,
      applicableProducts: products,
    });

    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: 'Coupon code already exists' };
    return { error: 'Failed to create coupon' };
  }
}

export async function getCoupons() {
  try { await assertAdmin(); } catch { return []; }
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return serialize(coupons);
}

export async function deleteCoupon(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  await Coupon.findByIdAndDelete(id);
  revalidatePath('/admin/coupons');
  return { success: true };
}

// ─── USER ORDERS ──────────────────────────────────────────────────────────────
export async function getUserOrders() {
  let session;
  try { session = await assertSession(); } catch { return []; }
  await connectDB();

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  if (!userId) return [];

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  if (!orders?.length) return [];

  const productIds = orders
    .flatMap(o => o.items.map(i => (i.product?._id) ? i.product._id : i.product))
    .filter(Boolean);

  const products = await Product.find({ _id: { $in: productIds } }).select('reviews').lean();

  orders.forEach(order => {
    order.items.forEach(item => {
      const productIdStr = (item.product?._id || item.product)?.toString();
      const product = products.find(p => p._id.toString() === productIdStr);
      if (product?.reviews) {
        const review = product.reviews.find(r => r.orderId?.toString() === order._id.toString());
        if (review) {
          item.hasReviewed = true;
          item.userRating = review.rating;
          item.userComment = review.comment;
        } else {
          item.hasReviewed = false;
        }
      }
    });
  });

  return serialize(orders);
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
export async function createOrder(orderData) {
  await connectDB();

  // ── Protection: extract request identity, check blocks + rate limits ──
  const { ip, userAgent } = await getRequestMeta();
  const deviceId = sanitizeString(orderData.deviceId || '', 64);

  // Session is optional — guest checkout allowed
  let userId = null;
  let isGuest = false;
  let session;
  try { session = await assertSession(); } catch { /* guest checkout — no login required */ }

  if (session?.user) {
    userId = session.user.id;
    if (!userId && session.user.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user) userId = user._id;
    }
  }

  // Guest checkout: find or create a guest account from submitted info
  if (!userId) {
    const guestFirst = sanitizeString(orderData.guestInfo?.firstName, 50);
    const guestLast = sanitizeString(orderData.guestInfo?.lastName || '', 50);
    const guestEmail = sanitizeString(orderData.guestInfo?.email || '', 200).toLowerCase();
    const guestPhone = sanitizeString(orderData.guestInfo?.phone || '', 30);

    if (!guestFirst || !guestPhone) return { error: 'Name and phone are required.' };

    let guestUser = null;
    if (guestEmail) {
      guestUser = await User.findOne({ email: guestEmail });
    }
    if (!guestUser && guestPhone) {
      guestUser = await User.findOne({ phone: guestPhone, provider: 'guest' });
    }

    if (!guestUser) {
      const emailForGuest = guestEmail || `guest_${guestPhone}@oura.guest`;
      try {
        guestUser = await User.create({
          name: `${guestFirst} ${guestLast}`.trim(),
          email: emailForGuest,
          phone: guestPhone,
          provider: 'guest',
          role: 'user',
          isVerified: false,
          // Capture network identity at account creation time
          registrationIp:       ip || null,
          registrationDeviceId: deviceId || null,
        });
      } catch (e) {
        // Email already exists (non-guest account) — link to that account
        if (e.code === 11000 && guestEmail) {
          guestUser = await User.findOne({ email: guestEmail });
        } else {
          return { error: 'Could not create guest account. Please try again.' };
        }
      }
      isGuest = true;
    }

    userId = guestUser._id;
  }

  // ── Block + rate-limit check (after userId is resolved) ──
  const protectErr = await checkOrderProtection(ip, deviceId, userId);
  if (protectErr) return { error: protectErr };

  if (!orderData?.items?.length) return { error: 'Cart is empty' };

  const calcResult = await calculateCart(orderData.items, orderData.couponCode);

  if (!calcResult.validatedCart?.length) return { error: 'No valid items in cart.' };

  // ── Atomic stock reservation — serialized per product by MongoDB document lock ──
  // If stock is insufficient, releaseStock rolls back any partial reservations.
  const stockResult = await reserveStock(calcResult.validatedCart);
  if (stockResult.error) {
    await trackAttempt({ ip, deviceId, userId, userAgent, type: 'stock_fail',
      productIds: calcResult.validatedCart.map(i => String(i._id)) });
    return { error: stockResult.error };
  }

  // Load delivery pricing from settings
  const deliverySettings = await Settings.findOne({ key: 'delivery_pricing' }).lean();
  const insideCost = deliverySettings?.value?.insideDhaka ?? 80;
  const outsideCost = deliverySettings?.value?.outsideDhaka ?? 150;
  const freeDelivery = deliverySettings?.value?.freeDelivery ?? false;
  const shippingFee = freeDelivery ? 0 : (orderData.shippingAddress?.method === 'outside' ? outsideCost : insideCost);

  const year  = new Date().getFullYear();
  const seq   = String(await nextInvoiceSeq(year)).padStart(4, '0');
  const count = await Order.countDocuments();

  // Only take explicitly allowed fields from orderData — never spread it directly
  const newOrder = new Order({
    user: userId,
    orderId: `#OL-${1000 + count + 1}`,
    invoiceNumber: `INV-${year}-${seq}`,
    status: 'Pending',
    shippingAddress: orderData.shippingAddress,
    guestInfo: orderData.guestInfo,
    paymentMethod: sanitizeString(orderData.paymentMethod || 'COD', 30),
    subTotal: calcResult.cartTotal,
    discountAmount: calcResult.discountTotal || 0,
    shippingFee,
    couponCode: calcResult.appliedCoupon?.code || null,
    totalAmount: calcResult.grandTotal + shippingFee,
    clientIp:  ip,
    deviceId,
    userAgent,
    items: calcResult.validatedCart.map(vi => ({
      product: vi._id,
      name: vi.name,
      price: vi.price,
      basePrice: vi.basePrice ?? vi.price,
      quantity: vi.quantity,
      size: vi.selectedSize || vi.size,
      image: vi.image,
      sku: vi.sku || null,
      barcode: vi.barcode || null,
    })),
  });

  let savedOrder;
  try {
    await newOrder.save();
    savedOrder = newOrder;
  } catch (err) {
    // Order save failed after stock was reserved — release stock to avoid permanent lock
    await releaseStockItems(calcResult.validatedCart.map(vi => ({
      _id: vi._id, name: vi.name,
      size: vi.selectedSize || vi.size, quantity: vi.quantity,
    })));
    throw err;
  }

  // Stock was already atomically decremented by reserveStock() above — do NOT decrement again.

  await trackAttempt({ ip, deviceId, userId, userAgent, type: 'order_created',
    productIds: calcResult.validatedCart.map(i => String(i._id)) });

  // Update the user's known IPs and devices
  trackUserActivity(userId, { ip, deviceId, userAgent });

  if (calcResult.appliedCoupon) {
    await Coupon.findOneAndUpdate(
      { code: calcResult.appliedCoupon.code },
      { $inc: { usedCount: 1 }, $push: { usedBy: { user: userId, usedAt: new Date() } } }
    );
  }

  // Save address to Address model if requested (works for both logged-in and guest users)
  if (orderData.saveAddress && userId) {
    const gi = orderData.guestInfo;
    const addrFields = {
      address:  sanitizeString(gi?.address || '', 300),
      city:     sanitizeString(gi?.city    || '', 100),
    };
    if (addrFields.address && addrFields.city) {
      try {
        await Address.create({
          user:      userId,
          label:     'Home',
          firstName: sanitizeString(gi?.firstName || '', 50),
          lastName:  sanitizeString(gi?.lastName  || '', 50),
          phone:     sanitizeString(gi?.phone     || '', 30),
          address:   addrFields.address,
          city:      addrFields.city,
          postalCode: sanitizeString(gi?.postalCode || '', 20),
        });
      } catch { /* duplicate or validation — non-fatal */ }
    }
  }

  revalidatePath('/admin/orders');

  // noSession = user placed this order without being logged in
  const noSession = !session?.user;
  return {
    success: true,
    orderId: newOrder.orderId,
    isGuest: noSession,
    guestEmail: noSession ? (orderData.guestInfo?.email || null) : null,
    guestPhone: noSession ? (orderData.guestInfo?.phone || null) : null,
  };
}

// ─── ONLINE PAYMENT: INITIATE (saves PendingOrder, no real order yet) ────────
export async function initiateOnlinePayment(orderData) {
  await connectDB();

  // ── Protection: extract request identity, check blocks + rate limits ──
  const { ip, userAgent } = await getRequestMeta();
  const deviceId = sanitizeString(orderData.deviceId || '', 64);

  let userId = null;
  let session;
  try { session = await assertSession(); } catch { /* guest allowed */ }

  if (session?.user) {
    userId = session.user.id;
    if (!userId && session.user.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user) userId = user._id;
    }
  }

  if (!userId) {
    const guestFirst = sanitizeString(orderData.guestInfo?.firstName, 50);
    const guestLast  = sanitizeString(orderData.guestInfo?.lastName || '', 50);
    const guestEmail = sanitizeString(orderData.guestInfo?.email || '', 200).toLowerCase();
    const guestPhone = sanitizeString(orderData.guestInfo?.phone || '', 30);

    if (!guestFirst || !guestPhone) return { error: 'Name and phone are required.' };

    let guestUser = null;
    if (guestEmail) guestUser = await User.findOne({ email: guestEmail });
    if (!guestUser && guestPhone) guestUser = await User.findOne({ phone: guestPhone, provider: 'guest' });

    if (!guestUser) {
      const emailForGuest = guestEmail || `guest_${guestPhone}@oura.guest`;
      try {
        guestUser = await User.create({
          name: `${guestFirst} ${guestLast}`.trim(),
          email: emailForGuest,
          phone: guestPhone,
          provider: 'guest',
          role: 'user',
          isVerified: false,
          registrationIp:       ip || null,
          registrationDeviceId: deviceId || null,
        });
      } catch (e) {
        if (e.code === 11000 && guestEmail) {
          guestUser = await User.findOne({ email: guestEmail });
        } else {
          return { error: 'Could not create guest account. Please try again.' };
        }
      }
    }

    userId = guestUser._id;
  }

  // ── Block + rate-limit check (after userId is resolved) ──
  const protectErr = await checkOrderProtection(ip, deviceId, userId);
  if (protectErr) return { error: protectErr };

  if (!orderData?.items?.length) return { error: 'Cart is empty' };

  const calcResult = await calculateCart(orderData.items, orderData.couponCode);
  if (!calcResult.validatedCart?.length) return { error: 'No valid items in cart.' };

  // ── Atomic stock reservation — serialized per product by MongoDB document lock ──
  const stockResult = await reserveStock(calcResult.validatedCart);
  if (stockResult.error) {
    await trackAttempt({ ip, deviceId, userId, userAgent, type: 'stock_fail',
      productIds: calcResult.validatedCart.map(i => String(i._id)) });
    return { error: stockResult.error };
  }

  const deliverySettings = await Settings.findOne({ key: 'delivery_pricing' }).lean();
  const insideCost  = deliverySettings?.value?.insideDhaka ?? 80;
  const outsideCost = deliverySettings?.value?.outsideDhaka ?? 150;
  const freeDelivery = deliverySettings?.value?.freeDelivery ?? false;
  const shippingFee  = freeDelivery ? 0 : (orderData.shippingAddress?.method === 'outside' ? outsideCost : insideCost);

  let pending;
  try {
    pending = await PendingOrder.create({
      userId,
      guestInfo:       orderData.guestInfo,
      shippingAddress: orderData.shippingAddress,
      paymentMethod:   sanitizeString(orderData.paymentMethod || 'bKash', 30),
      saveAddress:     !!orderData.saveAddress,
      stockReserved:   true,
      ip, deviceId, userAgent,
      subTotal:        calcResult.cartTotal,
      discountAmount:  calcResult.discountTotal || 0,
      shippingFee,
      couponCode:      calcResult.appliedCoupon?.code || null,
      totalAmount:     calcResult.grandTotal + shippingFee,
      items: calcResult.validatedCart.map(vi => ({
        product:   vi._id,
        name:      vi.name,
        price:     vi.price,
        basePrice: vi.basePrice ?? vi.price,
        quantity:  vi.quantity,
        size:      vi.selectedSize || vi.size,
        image:     vi.image,
        sku:       vi.sku || null,
        barcode:   vi.barcode || null,
      })),
    });
  } catch (err) {
    // PendingOrder creation failed — release the stock we just reserved
    await releaseStockItems(calcResult.validatedCart.map(vi => ({
      _id: vi._id, name: vi.name,
      size: vi.selectedSize || vi.size, quantity: vi.quantity,
    })));
    throw err;
  }

  await trackAttempt({ ip, deviceId, userId, userAgent, type: 'pending_created',
    productIds: calcResult.validatedCart.map(i => String(i._id)),
    pendingOrderId: pending._id.toString() });

  return { success: true, pendingId: pending._id.toString() };
}

// ─── ONLINE PAYMENT: CONFIRM (called from payment callbacks after success) ────
export async function confirmPendingOrder(pendingId, paymentDetails) {
  await connectDB();

  // Atomically claim the PendingOrder — only one concurrent callback wins.
  // If confirming is already true, another request got here first.
  const pending = await PendingOrder.findOneAndUpdate(
    { _id: pendingId, confirming: { $ne: true } },
    { $set: { confirming: true } },
    { new: false }
  );

  if (!pending) {
    // Either already claimed by a concurrent callback, or already confirmed (TTL deleted it).
    const existingOrder = await Order.findOne({ 'paymentDetails.pendingId': pendingId }).lean();
    if (existingOrder) {
      if (existingOrder.paymentStatus !== 'Paid') {
        await Order.findByIdAndUpdate(existingOrder._id, { paymentStatus: 'Paid', ...paymentDetails });
      }
      return { success: true, orderId: existingOrder.orderId };
    }
    // Still in-flight by the other request — return success optimistically
    return { success: true };
  }

  // Re-validate stock before creating the real order
  for (const item of pending.items) {
    const product = await Product.findById(item.product);
    if (!product) return { error: `Product not found: ${item.name}` };
    if (item.size && item.size !== 'STD' && item.size !== 'Standard') {
      const variant = product.variants.find(v => v.size === item.size);
      if (!variant || variant.stock < item.quantity) {
        return { error: `SOLD OUT: Size ${item.size} of "${item.name}".` };
      }
    } else if (product.stock < item.quantity) {
      return { error: `SOLD OUT: "${item.name}" is out of stock.` };
    }
  }

  const year  = new Date().getFullYear();
  const seq   = String(await nextInvoiceSeq(year)).padStart(4, '0');
  const count = await Order.countDocuments();

  const newOrder = new Order({
    user:            pending.userId,
    orderId:         `#OL-${1000 + count + 1}`,
    invoiceNumber:   `INV-${year}-${seq}`,
    status:          'Pending',
    shippingAddress: pending.shippingAddress,
    guestInfo:       pending.guestInfo,
    paymentMethod:   pending.paymentMethod,
    subTotal:        pending.subTotal,
    discountAmount:  pending.discountAmount,
    shippingFee:     pending.shippingFee,
    couponCode:      pending.couponCode,
    totalAmount:     pending.totalAmount,
    paymentStatus:   'Paid',
    paymentTransactionId: paymentDetails?.paymentTransactionId || null,
    paymentDetails:  { ...paymentDetails, pendingId },
    clientIp:  pending.ip       || null,
    deviceId:  pending.deviceId || null,
    userAgent: pending.userAgent || null,
    items: pending.items.map(i => ({
      product:   i.product,
      name:      i.name,
      price:     i.price,
      basePrice: i.basePrice ?? i.price,
      quantity:  i.quantity,
      size:      i.size,
      image:     i.image,
      sku:       i.sku || null,
      barcode:   i.barcode || null,
    })),
  });

  await newOrder.save();

  // Only decrement stock here if it wasn't already reserved at pending-order creation time.
  // (stockReserved=true means stock was decremented atomically before payment — skip to avoid double-decrement)
  if (!pending.stockReserved) {
    for (const item of pending.items) {
      if (item.size && item.size !== 'STD' && item.size !== 'Standard') {
        await Product.updateOne(
          { _id: item.product, 'variants.size': item.size },
          { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }
  }

  if (pending.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: pending.couponCode },
      { $inc: { usedCount: 1 }, $push: { usedBy: { user: pending.userId, usedAt: new Date() } } }
    );
  }

  if (pending.saveAddress && pending.userId) {
    const gi = pending.guestInfo;
    if (gi?.address && gi?.city) {
      try {
        await Address.create({
          user:       pending.userId,
          label:      'Home',
          firstName:  sanitizeString(gi.firstName || '', 50),
          lastName:   sanitizeString(gi.lastName  || '', 50),
          phone:      sanitizeString(gi.phone     || '', 30),
          address:    sanitizeString(gi.address,        300),
          city:       sanitizeString(gi.city,           100),
          postalCode: sanitizeString(gi.postalCode || '', 20),
        });
      } catch { /* non-fatal */ }
    }
  }

  await PendingOrder.findByIdAndDelete(pendingId);
  revalidatePath('/admin/orders');

  // Update the user's known IPs and devices
  if (pending.ip || pending.deviceId) {
    trackUserActivity(pending.userId, {
      ip: pending.ip, deviceId: pending.deviceId, userAgent: pending.userAgent,
    });
  }

  return { success: true, orderId: newOrder.orderId };
}

// ─── RELEASE RESERVED STOCK (abandoned / failed payments) ────────────────────
// Call this from your payment-failure / cancel callback routes.
// Also useful as a periodic cleanup for PendingOrders older than 2 hours.
export async function releasePendingOrderStock(pendingId, reason = 'payment_fail') {
  await connectDB();
  const pending = await PendingOrder.findById(pendingId).lean();
  if (!pending) return { success: true }; // already gone
  if (pending.stockReserved) {
    await releaseStockItems(pending.items);
  }
  await PendingOrder.findByIdAndDelete(pendingId);

  // Track the failure for abuse detection
  await trackAttempt({
    ip:         pending.ip       || 'unknown',
    deviceId:   pending.deviceId || '',
    userId:     pending.userId,
    userAgent:  pending.userAgent || '',
    type:       reason === 'payment_cancel' ? 'payment_cancel' : 'payment_fail',
    productIds: pending.items.map(i => String(i.product)),
    pendingOrderId: pendingId,
  });

  return { success: true };
}

// Releases stock for ALL pending orders that have been sitting for over 2 hours
// without being confirmed (abandoned payments). Safe to call on a cron or at startup.
export async function releaseExpiredPendingOrders() {
  await connectDB();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const expired = await PendingOrder.find({
    stockReserved: true,
    confirming: { $ne: true },
    createdAt: { $lt: cutoff },
  }).lean();
  for (const p of expired) {
    await releaseStockItems(p.items);
    await PendingOrder.findByIdAndDelete(p._id);
  }
  return { released: expired.length };
}

// ─── ADMIN ORDER MANAGEMENT ───────────────────────────────────────────────────
export async function getAdminOrders() {
  try { await assertAdmin(); } catch { return []; }
  await connectDB();
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .populate('user', 'name email')
    .lean();
  return serialize(orders);
}

export async function updateOrderStatus(orderId, newStatus, cancellationReason = null) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(orderId)) return { error: 'Invalid order ID' };
  if (!ALLOWED_STATUSES.includes(newStatus)) return { error: 'Invalid status' };
  await connectDB();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };

    if (newStatus === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items) {
        if (item.product) {
          if (item.size && item.size !== 'STD' && item.size !== 'Standard') {
            await Product.updateOne(
              { _id: item.product, 'variants.size': item.size },
              { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity } }
            );
          } else {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
          }
        }
      }
    }

    order.status = newStatus;

    // COD orders are paid at the door — mark as Paid when delivered
    if (newStatus === 'Delivered' && order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
    }

    if (cancellationReason) order.cancellationReason = sanitizeString(cancellationReason, 500);
    await order.save();
    revalidatePath('/admin/orders');
    revalidatePath('/admin/invoices');
    return { success: true };
  } catch (error) { return { error: 'Failed to update status' }; }
}

// ─── BACKFILL LEGACY INVOICE NUMBERS ─────────────────────────────────────────
export async function backfillInvoiceNumbers() {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  // Find all orders missing an invoiceNumber, oldest first
  const legacy = await Order.find(
    { $or: [{ invoiceNumber: { $exists: false } }, { invoiceNumber: null }, { invoiceNumber: '' }] },
    { _id: 1, createdAt: 1 }
  ).sort({ createdAt: 1 }).lean();

  if (!legacy.length) return { success: true, backfilled: 0 };

  // Find the highest existing sequence number to avoid collisions
  const existing = await Order.find(
    { invoiceNumber: { $regex: /^INV-\d{4}-\d+$/ } },
    { invoiceNumber: 1 }
  ).lean();

  let maxSeq = 0;
  for (const o of existing) {
    const parts = o.invoiceNumber?.split('-');
    if (parts?.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  // Assign sequential invoice numbers
  const bulkOps = legacy.map((order, idx) => {
    const date = new Date(order.createdAt);
    const year = date.getFullYear();
    const seq  = String(maxSeq + idx + 1).padStart(4, '0');
    return {
      updateOne: {
        filter: { _id: order._id },
        update: { $set: { invoiceNumber: `INV-${year}-${seq}` } },
      },
    };
  });

  await Order.bulkWrite(bulkOps);
  revalidatePath('/admin/invoices');
  return { success: true, backfilled: legacy.length };
}
