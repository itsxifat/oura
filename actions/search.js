'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import SearchLog from '@/models/SearchLog';
import SearchPinned from '@/models/SearchPinned';
import { escapeRegex, sanitizeString, assertAdmin } from '@/lib/security';

const MAX_LOGS = 1000;

// ─── public: log a search query ──────────────────────────────────────────────
export async function logSearch(query) {
  if (!query?.trim() || query.trim().length < 2) return;
  await connectDB();

  const clean = sanitizeString(query.trim(), 200);
  if (!clean) return;

  // Insert new log
  await SearchLog.create({ query: clean });

  // If over cap, delete oldest entries beyond MAX_LOGS
  const total = await SearchLog.countDocuments();
  if (total > MAX_LOGS) {
    const excess = total - MAX_LOGS;
    const oldest = await SearchLog.find({})
      .sort({ createdAt: 1 })
      .limit(excess)
      .select('_id')
      .lean();
    const ids = oldest.map(d => d._id);
    await SearchLog.deleteMany({ _id: { $in: ids } });
  }
}

// ─── public: get trending keywords ───────────────────────────────────────────
// Returns { pinned: string[], trending: string[] }
// pinned = admin-set keywords (shown first), trending = top 5 from logs
export async function getTrendingSearches() {
  await connectDB();

  const [pinnedDocs, trendingAgg] = await Promise.all([
    SearchPinned.find({}).sort({ order: 1, createdAt: 1 }).lean(),
    SearchLog.aggregate([
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const pinned = pinnedDocs.map(p => ({ _id: p._id.toString(), keyword: p.keyword, order: p.order }));

  // Exclude keywords already shown as pinned (case-insensitive)
  const pinnedLower = new Set(pinned.map(p => p.keyword.toLowerCase()));
  const trending = trendingAgg
    .map(t => t._id)
    .filter(k => !pinnedLower.has(k))
    .slice(0, 5);

  return { pinned, trending };
}

// ─── public: search products ──────────────────────────────────────────────────
export async function searchProducts(query) {
  if (!query || query.trim().length < 1) return { products: [], categories: [] };

  await connectDB();

  const safe = escapeRegex(sanitizeString(query.trim(), 100));
  if (!safe) return { products: [], categories: [] };

  const regex = { $regex: safe, $options: 'i' };
  const now = new Date();

  // Search categories by name
  const categories = await Category.find({ name: regex }).limit(4).lean();

  // Find tag IDs matching query
  let tagIds = [];
  try {
    const Tag = (await import('@/models/Tag')).default;
    const tags = await Tag.find({ name: regex }).limit(10).lean();
    tagIds = tags.map(t => t._id);
  } catch (_) {}

  const catIds = categories.map(c => c._id);

  const products = await Product.find({
    $or: [
      { name: regex },
      { category: { $in: catIds } },
      ...(tagIds.length ? [{ tags: { $in: tagIds } }] : []),
    ],
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(8)
    .populate('category', 'name slug')
    .populate('tags', 'name color')
    .lean();

  const enriched = products.map((p) => {
    const saleActive =
      p.discountPrice > 0 &&
      p.discountPrice < p.price &&
      (!p.saleStartDate || new Date(p.saleStartDate) <= now) &&
      (!p.saleEndDate || new Date(p.saleEndDate) >= now);

    return {
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountPrice: saleActive ? p.discountPrice : null,
      image: p.images?.[0] || null,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      tags: (p.tags || []).map(t => ({ name: t.name, color: t.color })),
    };
  });

  return {
    products: enriched,
    categories: JSON.parse(JSON.stringify(categories)),
  };
}

// ─── admin: get all pinned keywords ──────────────────────────────────────────
export async function getPinnedSearches() {
  await assertAdmin();
  await connectDB();
  const docs = await SearchPinned.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return JSON.parse(JSON.stringify(docs));
}

// ─── admin: add a pinned keyword ─────────────────────────────────────────────
export async function addPinnedSearch(keyword) {
  await assertAdmin();
  if (!keyword?.trim()) throw new Error('Keyword required');
  await connectDB();
  const clean = sanitizeString(keyword.trim(), 100);
  // Check duplicate (case-insensitive)
  const exists = await SearchPinned.findOne({ keyword: { $regex: `^${escapeRegex(clean)}$`, $options: 'i' } });
  if (exists) throw new Error('Keyword already pinned');
  const maxDoc = await SearchPinned.findOne({}).sort({ order: -1 });
  const nextOrder = (maxDoc?.order ?? -1) + 1;
  const doc = await SearchPinned.create({ keyword: clean, order: nextOrder });
  return JSON.parse(JSON.stringify(doc));
}

// ─── admin: delete a pinned keyword ──────────────────────────────────────────
export async function deletePinnedSearch(id) {
  await assertAdmin();
  await connectDB();
  await SearchPinned.findByIdAndDelete(id);
}

// ─── admin: reorder pinned keywords ──────────────────────────────────────────
export async function reorderPinnedSearches(orderedIds) {
  await assertAdmin();
  await connectDB();
  await Promise.all(
    orderedIds.map((id, idx) => SearchPinned.findByIdAndUpdate(id, { order: idx }))
  );
}

// ─── admin: get search analytics ─────────────────────────────────────────────
export async function getSearchAnalytics() {
  await assertAdmin();
  await connectDB();

  const [total, topKeywords] = await Promise.all([
    SearchLog.countDocuments(),
    SearchLog.aggregate([
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return {
    total,
    topKeywords: topKeywords.map(k => ({ keyword: k._id, count: k.count })),
  };
}
