'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import Address from '@/models/Address';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth'; 
import { revalidatePath } from 'next/cache';

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// ... (Address, Coupon, User functions - KEEP THEM AS IS) ...
export async function getSavedAddresses() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
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
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };
  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  try {
    const addressData = {
      user: userId,
      label: formData.get('label') || 'Home',
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
    };
    await Address.create(addressData);
    revalidatePath('/checkout');
    return { success: true };
  } catch (error) { return { error: "Failed to save address" }; }
}

export async function createCoupon(formData) {
  await connectDB();
  try {
    const isAutomatic = formData.get('isAutomatic') === 'true';
    let code = formData.get('code');
    if (isAutomatic && !code) code = `AUTO-${Date.now()}`;
    await Coupon.create({
      code,
      description: formData.get('description'),
      isAutomatic,
      discountType: formData.get('discountType'),
      discountValue: Number(formData.get('discountValue')),
      minSpend: Number(formData.get('minSpend') || 0),
      minQuantity: Number(formData.get('minQuantity') || 0),
      validUntil: new Date(formData.get('validUntil')),
      usageLimit: Number(formData.get('usageLimit') || 10000),
      applicableCategories: formData.getAll('categories'), 
      applicableProducts: formData.getAll('products'), 
    });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) { return { error: 'Failed to create coupon' }; }
}

export async function getCoupons() {
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return serialize(coupons);
}

export async function deleteCoupon(id) {
  await connectDB();
  await Coupon.findByIdAndDelete(id);
  revalidatePath('/admin/coupons');
  return { success: true };
}

// --- CART CALCULATION LOGIC ---
function computeRuleDiscount(rule, verifiedItems, cartTotal, totalQty) {
  const now = new Date();
  if (!rule.isActive) return 0;
  if (now > new Date(rule.validUntil)) return 0;
  if (rule.usedCount >= rule.usageLimit) return 0;
  if (cartTotal < rule.minSpend) return 0;
  if (totalQty < rule.minQuantity) return 0;

  let eligibleAmount = cartTotal;
  const hasCatRestriction = rule.applicableCategories?.length > 0;
  const hasProdRestriction = rule.applicableProducts?.length > 0;

  if (hasCatRestriction || hasProdRestriction) {
     const catIds = rule.applicableCategories.map(id => id.toString());
     const prodIds = rule.applicableProducts.map(id => id.toString());

     const eligibleItems = verifiedItems.filter(item => {
        const itemCatId = item.category?._id ? item.category._id.toString() : item.category?.toString();
        const itemProdId = item._id.toString();
        return (
            (hasCatRestriction && itemCatId && catIds.includes(itemCatId)) ||
            (hasProdRestriction && prodIds.includes(itemProdId))
        );
     });
     
     if (eligibleItems.length === 0) return 0;
     eligibleAmount = eligibleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  let val = 0;
  if (rule.discountType === 'percentage') {
    val = (eligibleAmount * rule.discountValue) / 100;
    if (rule.maxDiscount && val > rule.maxDiscount) val = rule.maxDiscount;
  } else {
    val = rule.discountValue;
  }
  return Math.round(val);
}

export async function calculateCart(cartItems, manualCode = null) {
  console.log("--- DEBUG START: calculateCart ---");
  
  await connectDB();
  const response = { cartTotal: 0, discountTotal: 0, grandTotal: 0, appliedCoupon: null, error: null };
  
  if (!cartItems || cartItems.length === 0) return response;

  const productIds = cartItems.map(i => i._id || i.product);
  const dbProductsRaw = await Product.find({ _id: { $in: productIds } }).populate('category').lean();
  const dbProducts = serialize(dbProductsRaw);
  const now = new Date();

  console.log(`Checking ${dbProducts.length} products from DB...`);

  const verifiedItems = [];
  
  for (const clientItem of cartItems) {
      const dbProd = dbProducts.find(p => p._id.toString() === (clientItem._id || clientItem.product).toString());
      
      if (dbProd) {
          // --- DEBUGGING PRICES ---
          const basePrice = Number(dbProd.price);
          const discPrice = Number(dbProd.discountPrice);
          let effectivePrice = basePrice;
          
          console.log(`Product: ${dbProd.name}`);
          console.log(` > Base Price (DB): ${basePrice}`);
          console.log(` > Discount Price (DB): ${discPrice}`);

          // --- STRICT DISCOUNT LOGIC ---
          if (!isNaN(discPrice) && discPrice > 0 && discPrice < basePrice) {
             const start = dbProd.saleStartDate ? new Date(dbProd.saleStartDate) : null;
             const end = dbProd.saleEndDate ? new Date(dbProd.saleEndDate) : null;
             
             // Timezone safe check: If date is missing, treat as active
             const isStarted = !start || now >= start;
             const isNotEnded = !end || now <= end;
             
             console.log(` > Sale Active? ${isStarted && isNotEnded} (Start: ${start}, End: ${end}, Now: ${now})`);

             if (isStarted && isNotEnded) {
                 effectivePrice = discPrice;
                 console.log(` >>> APPLYING DISCOUNT: New Price is ${effectivePrice}`);
             } else {
                 console.log(` >>> DISCOUNT IGNORED: Date range invalid.`);
             }
          } else {
             console.log(` >>> NO VALID DISCOUNT DETECTED.`);
          }

          // --- SIZE LOGIC ---
          let finalSize = clientItem.size || clientItem.selectedSize; 
          if (!finalSize && dbProd.variants && dbProd.variants.length === 1) {
              finalSize = dbProd.variants[0].size;
              console.log(` > Auto-Assigned Size: ${finalSize}`);
          } else if (!finalSize) {
              finalSize = "STD"; 
              console.log(` > Defaulted Size to STD`);
          }

          verifiedItems.push({
              ...dbProd,
              _id: dbProd._id, 
              price: effectivePrice, // ✅ THIS MUST BE THE DISCOUNTED PRICE
              basePrice: basePrice, 
              quantity: clientItem.quantity, 
              selectedSize: finalSize, 
              sku: dbProd.sku,
              barcode: dbProd.barcode 
          });
      }
  }

  // Calculate Totals
  response.cartTotal = verifiedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalQty = verifiedItems.reduce((acc, item) => acc + item.quantity, 0);

  console.log(`Total Cart Value (Calculated): ${response.cartTotal}`);

  // Coupons
  const autoRules = await Coupon.find({ isAutomatic: true, isActive: true });
  let bestAutoDiscount = 0;
  let bestAutoRule = null;

  for (const rule of autoRules) {
    const amount = computeRuleDiscount(rule, verifiedItems, response.cartTotal, totalQty);
    if (amount > bestAutoDiscount) { bestAutoDiscount = amount; bestAutoRule = rule; }
  }

  if (manualCode) {
    const manualRule = await Coupon.findOne({ code: manualCode.toUpperCase(), isActive: true, isAutomatic: false });
    if (manualRule) {
      const manualAmount = computeRuleDiscount(manualRule, verifiedItems, response.cartTotal, totalQty);
      if (manualAmount > 0) {
        response.appliedCoupon = { code: manualRule.code, desc: manualRule.description, amount: manualAmount, isAuto: false };
        response.discountTotal = manualAmount;
      } else {
        response.error = `Requirements not met for ${manualCode}`;
        if (bestAutoRule) { 
            response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true }; 
            response.discountTotal = bestAutoDiscount; 
        }
      }
    } else {
      response.error = 'Invalid Coupon Code';
      if (bestAutoRule) { 
          response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true }; 
          response.discountTotal = bestAutoDiscount; 
      }
    }
  } else {
    if (bestAutoRule) {
      response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true };
      response.discountTotal = bestAutoDiscount;
    }
  }

  if (response.discountTotal > response.cartTotal) response.discountTotal = response.cartTotal;
  response.grandTotal = response.cartTotal - response.discountTotal;
  
  response.verifiedItems = verifiedItems;
  console.log("--- DEBUG END ---");
  return response;
}

// --- ORDER CREATION ---
export async function createOrder(orderData) {
  console.log("--- CREATE ORDER STARTED ---");
  await connectDB();
  const session = await getServerSession(authOptions);
  
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  
  // 1. Recalculate
  const calcResult = await calculateCart(orderData.items, orderData.couponCode);
  
  // 2. Stock Check
  for (const item of calcResult.verifiedItems) {
      const product = await Product.findById(item._id);
      if (!product) return { error: `Product not found: ${item.name}` };

      if (item.selectedSize && item.selectedSize !== "STD" && item.selectedSize !== "Standard") {
          const variant = product.variants.find(v => v.size === item.selectedSize);
          if (!variant) return { error: `Size '${item.selectedSize}' is not valid for "${product.name}".` };
          if (variant.stock < item.quantity) return { error: `SOLD OUT: Size ${item.selectedSize} of "${product.name}" is unavailable.` };
      } else if (product.stock < item.quantity) {
          return { error: `SOLD OUT: "${product.name}" is out of stock.` };
      }
  }

  // 3. Create Order
  const count = await Order.countDocuments();
  
  // LOG THE ITEMS BEING SAVED TO DB TO VERIFY PRICE
  console.log("Items to Save:", calcResult.verifiedItems.map(i => ({ name: i.name, price: i.price, size: i.selectedSize })));

  const newOrder = new Order({
    ...orderData,
    user: userId, 
    orderId: `#ANQ-${1000 + count + 1}`,
    status: 'Pending',
    subTotal: calcResult.cartTotal, 
    discountAmount: calcResult.discountTotal || 0,
    couponCode: calcResult.appliedCoupon?.code || null,
    totalAmount: calcResult.grandTotal + (orderData.shippingAddress.method === 'outside' ? 150 : 80),
    items: calcResult.verifiedItems.map(vi => ({
        product: vi._id,
        name: vi.name,
        price: vi.price, // ✅ VERIFY THIS IS DISCOUNTED IN CONSOLE
        basePrice: vi.basePrice,
        quantity: vi.quantity,
        size: vi.selectedSize, 
        image: vi.images?.[0] || vi.image,
        sku: vi.sku,         
        barcode: vi.barcode 
    }))
  });

  await newOrder.save();

  // 4. Inventory
  for (const item of calcResult.verifiedItems) {
    if (item.selectedSize && item.selectedSize !== "STD" && item.selectedSize !== "Standard") {
        await Product.updateOne(
            { _id: item._id, "variants.size": item.selectedSize },
            { $inc: { "variants.$.stock": -item.quantity, stock: -item.quantity } }
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

  revalidatePath('/admin/orders');
  console.log("--- ORDER CREATED SUCCESSFULLY ---");
  return { success: true, orderId: newOrder.orderId };
}

// ... (getUserOrders, getAdminOrders, updateOrderStatus - NO CHANGES NEEDED) ...
export async function getUserOrders() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return serialize(orders);
}

export async function getAdminOrders() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email').lean();
  return serialize(orders);
}

export async function updateOrderStatus(orderId, newStatus, cancellationReason = null) {
  await connectDB();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    const oldStatus = order.status;
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
       for (const item of order.items) {
          if (item.product) {
             if (item.size && item.size !== "STD" && item.size !== "Standard") {
                await Product.updateOne(
                   { _id: item.product, "variants.size": item.size },
                   { $inc: { "variants.$.stock": item.quantity, stock: item.quantity } }
                );
             } else {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
             }
          }
       }
    }
    order.status = newStatus;
    await order.save();
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) { return { error: "Failed to update status" }; }
}