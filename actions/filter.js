'use server'

import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { escapeRegex, sanitizeString } from '@/lib/security';

// Recursively collects all descendant category IDs (including the given ID itself)
async function getAllDescendantIds(categoryId, allCategories) {
  const ids = [categoryId];
  const children = allCategories.filter(
    (c) => c.parent && c.parent.toString() === categoryId.toString()
  );
  for (const child of children) {
    const childIds = await getAllDescendantIds(child._id, allCategories);
    ids.push(...childIds);
  }
  return ids;
}

export async function getCategoryPageData(slug, filters = {}) {
  await connectDB();

  // 1. Find the Requested Category
  const mainCategory = await Category.findOne({ slug }).lean();
  if (!mainCategory) return null;

  // 2. Load all categories once, then resolve descendants in memory
  const allCategories = await Category.find({}).lean();

  // Direct children of the current category (for sections)
  const subCategories = allCategories.filter(
    (c) => c.parent && c.parent.toString() === mainCategory._id.toString()
  );

  // 3. Filter Setup
  const min = filters.minPrice ? Number(filters.minPrice) : 0;
  const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
  const now = new Date();

  // --- QUERY LOGIC ---
  // catIds can be a single id or an array of ids
  const buildProductQuery = (catIds) => {
    const query = {
      category: Array.isArray(catIds) ? { $in: catIds } : catIds,
      // Optional: Ensure stock > 0
      // stock: { $gt: 0 }
    };

    // A. Advanced Search — escape input to prevent ReDoS and injection
    if (filters.search) {
      const safeSearch = escapeRegex(sanitizeString(filters.search, 100));
      if (safeSearch) {
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
        ];
      }
    }

    // B. Advanced Price Filter (Complex)
    // We use $expr to calculate "Effective Price" on the fly for filtering
    if (filters.minPrice || filters.maxPrice) {
      query.$expr = {
        $and: [
           // Check Min Price
           { $gte: [
              { $cond: {
                  if: { $and: [
                     { $gt: ["$discountPrice", 0] },
                     { $lt: ["$discountPrice", "$price"] },
                     // Check if Sale is Active
                     { $or: [ { $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] } ] },
                     { $or: [ { $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] } ] }
                  ]},
                  then: "$discountPrice",
                  else: "$price"
              }}, 
              min 
           ]},
           // Check Max Price
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

  // 4. Fetch Products for Main Category (only direct products, not from sub-categories)
  const mainProducts = await Product.find(buildProductQuery(mainCategory._id))
    .sort({ createdAt: -1 })
    .populate('category')
    .populate('tags')
    .lean();

  // 5. Fetch Products for Each Sub-Category (including all their descendants)
  const sections = await Promise.all(subCategories.map(async (sub) => {
    // Get all descendant IDs so products from nested sub-categories are included
    const descendantIds = await getAllDescendantIds(sub._id, allCategories);
    const products = await Product.find(buildProductQuery(descendantIds))
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category')
      .populate('tags')
      .lean();

    return {
      _id: sub._id.toString(),
      name: sub.name,
      slug: sub.slug,
      products: JSON.parse(JSON.stringify(products))
    };
  }));

  return {
    mainCategory: JSON.parse(JSON.stringify(mainCategory)),
    mainProducts: JSON.parse(JSON.stringify(mainProducts)),
    sections: sections.filter(s => s.products.length > 0) // Only return sections with products
  };
}

export async function getTopCategories() {
  await connectDB();
  const categories = await Category.find({ parent: null }).lean();
  return JSON.parse(JSON.stringify(categories));
}