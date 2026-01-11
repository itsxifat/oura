'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import UserInterest from '@/models/UserInterest';
import { cookies } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function trackInterest({ productId, type = 'view' }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  let guestId = cookieStore.get('guest_id')?.value;

  if (!session && !guestId) {
    // Note: In Server Actions, setting cookies is restricted in some contexts.
    // For now, we skip guest generation if missing to prevent errors.
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const score = type === 'cart' ? 3 : 1;

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
  }
}

export async function getRecommendedProducts() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const guestId = cookieStore.get('guest_id')?.value;

  let interests = [];
  
  if (session?.user?.id || guestId) {
    const query = session?.user?.id ? { user: session.user.id } : { guestId };
    try {
        interests = await UserInterest.find(query).sort({ createdAt: -1 }).limit(20).lean();
    } catch (e) {
        console.log("No interest history found");
    }
  }

  let products = [];

  if (interests.length > 0) {
    const tagCounts = {};
    const catCounts = {};

    interests.forEach(i => {
      if (i.category) catCounts[i.category] = (catCounts[i.category] || 0) + i.score;
      if (i.tags) i.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + i.score);
    });

    const topCats = Object.keys(catCounts).sort((a,b) => catCounts[b] - catCounts[a]).slice(0, 2);
    const topTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

    products = await Product.find({
      $or: [
        { category: { $in: topCats } },
        { tags: { $in: topTags } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category')
    .lean();
  }

  if (products.length < 5) {
    const bestSellers = await Product.find({ _id: { $nin: products.map(p => p._id) } })
      .sort({ createdAt: -1 }) 
      .limit(10 - products.length)
      .populate('category')
      .lean();
    products = [...products, ...bestSellers];
  }

  return JSON.parse(JSON.stringify(products));
}