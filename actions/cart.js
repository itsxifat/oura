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
      // Use .lean() for plain objects, cleaner performance
      const product = await Product.findById(item._id)
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
        name: product.name,
        slug: product.slug,
        image: (product.images && product.images.length > 0) ? product.images[0] : '/placeholder.jpg',
        price: product.price,
        discountPrice: isSaleActive ? product.discountPrice : null,
        category: product.category, // Will be serialized at end
        tags: product.tags,         // Will be serialized at end
        tag: displayTag,            // <--- The specific tag string for UI
        stock: availableStock,
        barcode: product.barcode
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

// --- 2. CATEGORY PAGE DATA ---
export async function getCategoryPageData(slug, filters = {}) {
  await connectDB();

  // 1. Find Main Category
  const mainCategory = await Category.findOne({ slug }).lean();
  if (!mainCategory) return null;

  // 2. Find Sub Categories
  const subCategories = await Category.find({ parentCategory: mainCategory._id }).lean();
  
  // 3. Filter Setup
  const min = filters.minPrice ? Number(filters.minPrice) : 0;
  const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
  const now = new Date();

  // 4. Build Query Helper
  const buildProductQuery = (catId) => {
    const query = { category: catId };

    if (filters.search) {
      query.$or = [
         { name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      query.$expr = {
        $and: [
           { $gte: [
              { $cond: {
                  if: { $and: [
                     { $gt: ["$discountPrice", 0] },
                     { $lt: ["$discountPrice", "$price"] },
                     { $or: [ { $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] } ] },
                     { $or: [ { $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] } ] }
                  ]},
                  then: "$discountPrice",
                  else: "$price"
              }}, 
              min 
           ]},
           { $lte: [
              { $cond: {
                  if: { $and: [
                     { $gt: ["$discountPrice", 0] },
                     { $lt: ["$discountPrice", "$price"] },
                     { $or: [ { $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] } ] },
                     { $or: [ { $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] } ] }
                  ]},
                  then: "$discountPrice",
                  else: "$price"
              }}, 
              max 
           ]}
        ]
      };
    }
    return query;
  };

  // 5. Fetch Products (Main)
  const mainProducts = await Product.find(buildProductQuery(mainCategory._id))
    .sort({ createdAt: -1 })
    .populate('category')
    .populate('tags')
    .lean();

  // 6. Fetch Products (Sections)
  const sections = await Promise.all(subCategories.map(async (sub) => {
    const products = await Product.find(buildProductQuery(sub._id))
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category')
      .populate('tags')
      .lean();

    return {
      _id: sub._id,
      name: sub.name,
      slug: sub.slug,
      products
    };
  }));

  // --- CRITICAL FIX: DEEP SERIALIZATION ---
  return JSON.parse(JSON.stringify({
    mainCategory,
    mainProducts,
    sections: sections.filter(s => s.products.length > 0)
  }));
}

// --- 3. TOP CATEGORIES (For Main Page) ---
export async function getTopCategories() {
  await connectDB();
  
  // Example logic: Get parent categories
  const categories = await Category.find({ parentCategory: null })
    .limit(4)
    .lean();

  // --- CRITICAL FIX: DEEP SERIALIZATION ---
  return JSON.parse(JSON.stringify(categories));
}