'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Coupon from '@/models/Coupon';
import Tag from '@/models/Tag'; // Needed for population

// --- 1. CART CALCULATION & SYNC ---
export async function calculateCart(localCart, manualCode = '') {
  await connectDB();

  let validatedCart = [];
  let cartTotal = 0;
  let discountTotal = 0;
  
  // A. VALIDATE ITEMS (Fetch fresh data from DB)
  for (const item of localCart) {
    try {
      const productId = item._id || item.product;
      const product = await Product.findById(productId)
        .populate('category')
        .populate('tags')
        .lean();

      if (!product) continue;

      // 1. Calculate Price (Check Sale Date)
      const now = new Date();
      const isSaleActive = product.discountPrice && 
        product.discountPrice < product.price &&
        (!product.saleStartDate || new Date(product.saleStartDate) <= now) &&
        (!product.saleEndDate || new Date(product.saleEndDate) >= now);

      const currentPrice = isSaleActive ? product.discountPrice : product.price;

      // 2. Check Stock (Variant vs Global)
      let availableStock = product.stock;
      if (item.selectedSize && product.variants) {
         const variant = product.variants.find(v => v.size === item.selectedSize);
         if (variant) availableStock = variant.stock;
      }

      // 3. Determine Tag (DB > Sale > New)
      let displayTag = null;
      if (product.tags && product.tags.length > 0) {
         // Handle if tags are populated objects or just IDs
         displayTag = product.tags[0].name || null;
      } 
      
      if (!displayTag) {
         if (isSaleActive) displayTag = "SALE";
         else if (new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) displayTag = "NEW";
      }

      // 4. Construct Fresh Item
      const freshItem = {
        ...item,
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: (product.images && product.images.length > 0) ? product.images[0] : '/placeholder.jpg',
        price: currentPrice,
        basePrice: product.price,
        discountPrice: isSaleActive ? product.discountPrice : null,
        sku: product.sku || null,
        barcode: product.barcode || null,
        category: product.category,
        tags: product.tags,
        tag: displayTag,
        stock: availableStock,
      };

      // Cap quantity
      if (freshItem.quantity > availableStock) {
        freshItem.quantity = Math.max(0, availableStock);
      }

      if (freshItem.quantity > 0) {
        validatedCart.push(freshItem);
        cartTotal += currentPrice * freshItem.quantity;
      }

    } catch (e) {
      console.error("Cart Item Error:", item._id, e);
    }
  }

  // B. COUPON LOGIC (Restored)
  let appliedCoupon = null;
  let error = null;

  if (manualCode) {
    try {
      const coupon = await Coupon.findOne({ 
        code: manualCode.toUpperCase() 
      }).lean();

      const now = new Date();

      if (!coupon) {
        error = "Invalid coupon code";
      } else if (!coupon.isActive) {
        error = "Coupon is no longer active";
      } else if (coupon.startDate && new Date(coupon.startDate) > now) {
        error = "Coupon not yet active";
      } else if (coupon.endDate && new Date(coupon.endDate) < now) {
        error = "Coupon expired";
      } else if (cartTotal < (coupon.minPurchaseAmount || 0)) {
        error = `Minimum spend of ৳${coupon.minPurchaseAmount} required`;
      } else {
        // Valid Coupon
        let amount = 0;
        if (coupon.discountType === 'percentage') {
          amount = Math.round((cartTotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount) amount = Math.min(amount, coupon.maxDiscountAmount);
        } else {
          amount = coupon.discountValue;
        }
        
        discountTotal += amount;
        appliedCoupon = { 
          code: coupon.code, 
          amount: amount, 
          desc: coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`,
          isAuto: false 
        };
      }
    } catch (err) {
      console.error("Coupon Error:", err);
      error = "Error applying coupon";
    }
  }

  const grandTotal = Math.max(0, cartTotal - discountTotal);

  // --- CRITICAL FIX: DEEP SERIALIZATION ---
  // passing plain objects removes the "toJSON" error
  return JSON.parse(JSON.stringify({
    cartTotal,
    discountTotal,
    grandTotal,
    appliedCoupon,
    error,
    validatedCart
  }));
}
