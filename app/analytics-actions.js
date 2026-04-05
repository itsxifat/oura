'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import UserInterest from '@/models/UserInterest';
import GlobalSetting from '@/models/GlobalSetting';
import { cookies } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function trackInterest({ productId, type = 'view' }) {
  await connectDB();
  
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    let guestId = cookieStore.get('guest_id')?.value;

    const product = await Product.findById(productId);
    if (!product) return;

    // Weight scores: 'cart' indicates much higher interest than 'view'
    const score = type === 'cart' ? 5 : 1;

    await UserInterest.create({
      user: session?.user?.id || null,
      guestId: session ? null : guestId,
      tags: product.tags || [],
      category: product.category,
      interactionType: type,
      score: score
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    // Silent fail is mostly okay for analytics to prevent blocking UI
  }
}

export async function getRecommendedProducts() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const guestId = cookieStore.get('guest_id')?.value;

  let interests = [];
  
  // 1. Fetch User Interests
  if (session?.user?.id || guestId) {
    const query = session?.user?.id ? { user: session.user.id } : { guestId };
    try {
        interests = await UserInterest.find(query)
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
    } catch (e) {
        console.error("Error fetching interests:", e);
    }
  }

  let products = [];
  let excludeIds = [];

  // 2. Algorithm: Determine Top Categories & Tags
  if (interests.length > 0) {
    const tagCounts = {};
    const catCounts = {};

    interests.forEach(i => {
      if (i.category) catCounts[i.category] = (catCounts[i.category] || 0) + i.score;
      // Ensure tags exists and is array before iterating
      if (Array.isArray(i.tags)) {
          i.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + i.score);
      }
    });

    const topCats = Object.keys(catCounts).sort((a,b) => catCounts[b] - catCounts[a]).slice(0, 2);
    const topTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

    // 3. Query Recommended Products (WITH TAGS POPULATED)
    products = await Product.find({
      $or: [
        { category: { $in: topCats } },
        { tags: { $in: topTags } }
      ],
      stock: { $gt: 0 } // Optional: Only recommend in-stock items
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category') // Existing populate
    .populate('tags')     // <--- FIX: This was missing! Now returns Tag objects with names.
    .lean();
    
    excludeIds = products.map(p => p._id);
  }

  // 4. Fallback: Use admin-selected default products if user has no/few recommendations
  if (products.length < 5) {
    // Try admin-curated defaults first
    const setting = await GlobalSetting.findOne({ identifier: 'default_recommended_products' }).lean();
    const defaultIds = setting?.value?.productIds || [];

    if (defaultIds.length > 0) {
      const needed = 10 - products.length;
      const adminDefaults = await Product.find({
        _id: { $in: defaultIds, $nin: excludeIds },
        stock: { $gt: 0 }
      })
        .populate('category')
        .populate('tags')
        .lean();

      // Preserve admin-defined order
      const orderedDefaults = defaultIds
        .map(id => adminDefaults.find(p => p._id.toString() === id.toString()))
        .filter(Boolean)
        .slice(0, needed);

      products = [...products, ...orderedDefaults];
    }

    // If still not enough, fill with newest products
    if (products.length < 5) {
      excludeIds = products.map(p => p._id);
      const newest = await Product.find({
        _id: { $nin: excludeIds },
        stock: { $gt: 0 }
      })
        .sort({ createdAt: -1 })
        .limit(10 - products.length)
        .populate('category')
        .populate('tags')
        .lean();

      products = [...products, ...newest];
    }
  }

  // 5. Clean up data for Next.js Server Components
  return JSON.parse(JSON.stringify(products));
}