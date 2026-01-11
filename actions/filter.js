'use server'

import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
// Make sure you import other models if your file uses them

export async function getCategoryPageData(slug, filters = {}) {
  await connectDB();

  // 1. Find the Requested Category
  const mainCategory = await Category.findOne({ slug }).lean();
  if (!mainCategory) return null;

  // 2. Find Child Categories (Sub-Categories)
  const subCategories = await Category.find({ parentCategory: mainCategory._id }).lean();
  const subCatIds = subCategories.map(c => c._id);
  
  // 3. Filter Setup
  const min = filters.minPrice ? Number(filters.minPrice) : 0;
  const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
  const now = new Date();

  // --- QUERY LOGIC ---
  const buildProductQuery = (catId) => {
    const query = {
      category: catId,
      // Optional: Ensure stock > 0
      // stock: { $gt: 0 } 
    };

    // A. Advanced Search (Name or Tags)
    if (filters.search) {
      query.$or = [
         { name: { $regex: filters.search, $options: 'i' } },
         { tags: { $regex: filters.search, $options: 'i' } } // Assuming tag names are stored or populated
      ];
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

  // 4. Fetch Products for Main Category
  const mainProducts = await Product.find(buildProductQuery(mainCategory._id))
    .sort({ createdAt: -1 })
    .populate('category')
    .populate('tags') // Populate tags for badge display
    .lean();

  // 5. Fetch Products for Each Sub-Category
  const sections = await Promise.all(subCategories.map(async (sub) => {
    const products = await Product.find(buildProductQuery(sub._id))
      .sort({ createdAt: -1 })
      .limit(8) // Limit sub-section display
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