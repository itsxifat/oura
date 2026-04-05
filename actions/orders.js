'use server'

import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import Address from '@/models/Address';
import User from '@/models/User';
import Settings from '@/models/Settings';
import Tag from '@/models/Tag';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateCart } from './cart';
import { assertAdmin, assertSession, isValidObjectId, sanitizeString } from '@/lib/security';

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

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

  if (!orderData?.items?.length) return { error: 'Cart is empty' };

  const calcResult = await calculateCart(orderData.items, orderData.couponCode);

  if (!calcResult.validatedCart?.length) return { error: 'No valid items in cart.' };

  for (const item of calcResult.validatedCart) {
    const product = await Product.findById(item._id);
    if (!product) return { error: `Product not found: ${item.name}` };

    if (item.selectedSize && item.selectedSize !== 'STD' && item.selectedSize !== 'Standard') {
      const variant = product.variants.find(v => v.size === item.selectedSize);
      if (!variant) return { error: `Size '${item.selectedSize}' not valid for "${product.name}".` };
      if (variant.stock < item.quantity) return { error: `SOLD OUT: Size ${item.selectedSize} of "${product.name}".` };
    } else if (product.stock < item.quantity) {
      return { error: `SOLD OUT: "${product.name}" is out of stock.` };
    }
  }

  // Load delivery pricing from settings
  const deliverySettings = await Settings.findOne({ key: 'delivery_pricing' }).lean();
  const insideCost = deliverySettings?.value?.insideDhaka ?? 80;
  const outsideCost = deliverySettings?.value?.outsideDhaka ?? 150;
  const freeDelivery = deliverySettings?.value?.freeDelivery ?? false;
  const shippingFee = freeDelivery ? 0 : (orderData.shippingAddress?.method === 'outside' ? outsideCost : insideCost);

  const count = await Order.countDocuments();
  const year  = new Date().getFullYear();
  const seq   = String(count + 1).padStart(4, '0');

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

  await newOrder.save();

  for (const item of calcResult.validatedCart) {
    if (item.selectedSize && item.selectedSize !== 'STD' && item.selectedSize !== 'Standard') {
      await Product.updateOne(
        { _id: item._id, 'variants.size': item.selectedSize },
        { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
      );
    } else {
      await Product.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
    }
  }

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
