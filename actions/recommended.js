'use server'

import connectDB from '@/lib/db';
import GlobalSetting from '@/models/GlobalSetting';
import Product from '@/models/Product';
import { assertAdmin, isValidObjectId } from '@/lib/security';
import { revalidatePath } from 'next/cache';

const SETTING_KEY = 'default_recommended_products';

export async function getDefaultRecommendedProductIds() {
  await connectDB();
  const setting = await GlobalSetting.findOne({ identifier: SETTING_KEY }).lean();
  return setting?.value?.productIds || [];
}

export async function getDefaultRecommendedProducts() {
  await connectDB();
  const ids = await getDefaultRecommendedProductIds();
  if (!ids.length) return [];
  const products = await Product.find({ _id: { $in: ids } })
    .populate('category')
    .populate('tags')
    .lean();
  // Preserve admin-defined order
  const ordered = ids
    .map(id => products.find(p => p._id.toString() === id.toString()))
    .filter(Boolean);
  return JSON.parse(JSON.stringify(ordered));
}

export async function setDefaultRecommendedProducts(productIds) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  const validIds = productIds.filter(id => isValidObjectId(id)).slice(0, 10);
  await connectDB();
  await GlobalSetting.findOneAndUpdate(
    { identifier: SETTING_KEY },
    { value: { productIds: validIds } },
    { upsert: true, new: true }
  );
  revalidatePath('/admin/recommended');
  return { success: true };
}

export async function searchProductsForRecommended(query) {
  try { await assertAdmin(); } catch { return []; }
  await connectDB();
  const filter = query?.trim()
    ? { name: { $regex: query.trim(), $options: 'i' } }
    : {};
  const products = await Product.find(filter)
    .select('name slug images price discountPrice category stock')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return JSON.parse(JSON.stringify(products));
}
