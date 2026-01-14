'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

// --- HELPER FUNCTIONS ---
function generateSlug(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateCode(prefix = "OL") {
  const randomPart = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}-${randomPart}`;
}

// --- OFFER EXPIRY CHECKER (NEW HELPER) ---
async function checkAndResetOffer(product) {
  if (!product.saleEndDate) return product;

  const now = new Date();
  const endDate = new Date(product.saleEndDate);

  if (now > endDate) {
    // Offer Expired: Reset DB fields
    await Product.findByIdAndUpdate(product._id, {
      $unset: { discountPrice: "", saleStartDate: "", saleEndDate: "" }
    });
    
    // Return modified object immediately for UI consistency
    product.discountPrice = null;
    product.saleStartDate = null;
    product.saleEndDate = null;
  }
  return product;
}

// --- TAGS ---
export async function getTags() {
  await connectDB();
  const tags = await Tag.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(tags));
}

export async function createTag(formData) {
  await connectDB();
  try {
    const name = formData.get('name');
    const color = formData.get('color');
    const slug = generateSlug(name);
    await Tag.create({ name, slug, color });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Tag already exists' }; }
}

export async function deleteTag(id) {
  await connectDB();
  try {
    await Tag.findByIdAndDelete(id);
    await Product.updateMany({ tags: id }, { $pull: { tags: id } });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Failed to delete' }; }
}

export async function getProductsByTag(tagId) {
  await connectDB();
  const products = await Product.find({ tags: tagId }).select('name price images sku').lean();
  return JSON.parse(JSON.stringify(products));
}

// --- CATEGORIES ---
export async function createCategory(formData) {
  await connectDB();
  const name = formData.get('name');
  const parentId = formData.get('parentId') || null;
  const imageFile = formData.get('image'); 
  const slug = name.toLowerCase().replace(/ /g, '-');

  try {
    let imagePath = null;
    if (imageFile && imageFile.size > 0) imagePath = await saveFileToPublic(imageFile);
    await Category.create({ name, slug, parent: parentId, image: imagePath });
    revalidatePath('/admin/categories'); revalidatePath('/admin/navbar'); revalidatePath('/categories'); 
    return { success: true };
  } catch (error) { return { error: 'Failed to create category' }; }
}

export async function getCategoryPageData(slug, searchParams = {}) {
  await connectDB();
  try {
    const mainCategory = await Category.findOne({ slug }).lean();
    if (!mainCategory) return null;
    const subCategoriesRaw = await Category.find({ parent: mainCategory._id }).lean();
    
    let productFilter = {};
    if (searchParams.search) productFilter.name = { $regex: searchParams.search, $options: 'i' };
    if (searchParams.minPrice || searchParams.maxPrice) {
      productFilter.price = {};
      if (searchParams.minPrice) productFilter.price.$gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) productFilter.price.$lte = Number(searchParams.maxPrice);
    }

    const sections = await Promise.all(subCategoriesRaw.map(async (sub) => {
      let products = await Product.find({ category: sub._id, ...productFilter })
      .limit(12).sort({ createdAt: -1 }).lean();
      
      // Check Offers
      products = await Promise.all(products.map(checkAndResetOffer));

      return { ...sub, _id: sub._id.toString(), products: JSON.parse(JSON.stringify(products)) };
    }));

    let mainProducts = await Product.find({ category: mainCategory._id, ...productFilter }).limit(12).lean();
    
    // Check Offers
    mainProducts = await Promise.all(mainProducts.map(checkAndResetOffer));

    return { mainCategory: JSON.parse(JSON.stringify(mainCategory)), sections, mainProducts: JSON.parse(JSON.stringify(mainProducts)) };
  } catch (error) { return null; }
}

export async function getTopCategories() {
  await connectDB();
  const categories = await Category.find({ parent: null }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function deleteCategory(id) {
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function getCategories() {
  await connectDB();
  const categoriesRaw = await Category.find().lean();
  const categories = JSON.parse(JSON.stringify(categoriesRaw));
  const buildTree = (cats, parentId = null) => {
    return cats.filter(c => String(c.parent) === String(parentId)).map(c => ({
        ...c, _id: c._id.toString(), children: buildTree(cats, c._id)
    }));
  };
  return buildTree(categories, null);
}

// --- PRODUCTS ---
export async function getProductById(id) {
  await connectDB();
  try {
    let product = await Product.findById(id).populate('category').populate('tags').lean();
    if (!product) return null;
    
    // Check Offer
    product = await checkAndResetOffer(product);

    return JSON.parse(JSON.stringify(product));
  } catch (error) { return null; }
}

export async function getProductHierarchy() {
  await connectDB();
  const categories = await Category.find().lean();
  const hierarchy = await Promise.all(categories.map(async (cat) => {
    const products = await Product.find({ category: cat._id }).select('name price _id').lean();
    return { ...cat, _id: cat._id.toString(), products: JSON.parse(JSON.stringify(products)) };
  }));
  return JSON.parse(JSON.stringify(hierarchy));
}

export async function getAdminProducts() {
  await connectDB();
  const productsRaw = await Product.find().sort({ createdAt: -1 }).populate('category', 'name').populate('tags', 'name color').lean();
  return JSON.parse(JSON.stringify(productsRaw));
}

export async function updateProductTags(productId, tags) {
  await connectDB();
  try {
    await Product.findByIdAndUpdate(productId, { tags: tags });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: "Failed to update tags" }; }
}

// --- CORE PRODUCT LOGIC ---

export async function createProduct(formData) {
  await connectDB();
  try {
    const name = formData.get('name');
    const description = formData.get('description');
    
    // VALIDATION: Check Category explicitly
    const category = formData.get('category');
    if (!category || category === "") {
      return { error: "Category is required." };
    }

    const price = parseFloat(formData.get('price'));
    
    // Inventory Handling
    const variantsJson = formData.get('variants');
    const variants = variantsJson ? JSON.parse(variantsJson) : [];
    
    // Calculate total stock (sum of all variant stocks)
    const totalStock = variants.length > 0 
      ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : parseInt(formData.get('stock') || 0);

    // SANITIZATION: Handle empty strings for ObjectIds and Dates
    // This prevents "CastError" when form sends "" for optional fields
    const sizeGuideRaw = formData.get('sizeGuide');
    const sizeGuide = (sizeGuideRaw && sizeGuideRaw !== "") ? sizeGuideRaw : undefined;

    const discountPriceRaw = formData.get('discountPrice');
    const discountPrice = (discountPriceRaw && discountPriceRaw !== "") ? parseFloat(discountPriceRaw) : null;

    const startDateRaw = formData.get('saleStartDate');
    const saleStartDate = (startDateRaw && startDateRaw !== "") ? new Date(startDateRaw) : null;

    const endDateRaw = formData.get('saleEndDate');
    const saleEndDate = (endDateRaw && endDateRaw !== "") ? new Date(endDateRaw) : null;

    // Handle Auto-Gen or Manual Input
    let sku = formData.get('sku');
    if (sku === 'AUTO' || !sku || sku === "") sku = generateCode('SKU');
    
    let barcode = formData.get('barcode');
    if (barcode === 'AUTO' || !barcode || barcode === "") barcode = generateCode('BAR');

    const tags = formData.getAll('tags');
    const images = formData.getAll('images'); 
    const imagePaths = [];

    for (const file of images) {
      if (file.size > 0) {
        const path = await saveFileToPublic(file);
        if (path) imagePaths.push(path);
      }
    }

    const slug = generateSlug(name) + '-' + Date.now(); 

    await Product.create({
      name, slug, sku, barcode, description, price, 
      discountPrice, saleStartDate, saleEndDate,
      category, 
      stock: totalStock,
      variants,
      sizeGuide, 
      tags, 
      images: imagePaths 
    });

    revalidatePath('/admin/products'); 
    revalidatePath('/product'); 
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: "SKU or Barcode already exists." };
    console.error("Create Product Error:", error); 
    // Return explicit error if casting fails
    if (error.name === 'CastError') return { error: "Invalid data format (Category or ID)." };
    return { error: "Failed to create product" };
  }
}

export async function updateProduct(formData) {
  await connectDB();
  try {
    const id = formData.get('id');
    const product = await Product.findById(id);
    if (!product) return { error: "Product not found" };

    // 1. Basic Fields
    product.name = formData.get('name');
    product.description = formData.get('description');
    product.price = parseFloat(formData.get('price'));
    product.category = formData.get('category');
    
    // 2. Inventory Logic
    const variantsJson = formData.get('variants');
    if (variantsJson) {
        const parsedVariants = JSON.parse(variantsJson);
        product.variants = parsedVariants;
        // Automatically sum up stock from the variants
        product.stock = parsedVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } else {
        // Legacy fallback
        product.stock = parseInt(formData.get('stock') || product.stock);
    }

    // 3. Size Guide
    const sizeGuide = formData.get('sizeGuide');
    if (sizeGuide && sizeGuide.length > 0) {
        product.sizeGuide = sizeGuide;
    } else {
        product.sizeGuide = undefined; // Unset if empty
    }
    
    // 4. SKU & Barcode Logic
    const sku = formData.get('sku');
    if (sku === 'AUTO') {
        product.sku = generateCode('SKU');
    } else if (sku && sku.trim() !== '') {
        product.sku = sku;
    }

    const barcode = formData.get('barcode');
    if (barcode === 'AUTO') {
        product.barcode = generateCode('BAR');
    } else if (barcode && barcode.trim() !== '') {
        product.barcode = barcode;
    }

    // 5. Offers (Sanitize)
    const discountPriceRaw = formData.get('discountPrice');
    product.discountPrice = (discountPriceRaw && discountPriceRaw !== "") ? parseFloat(discountPriceRaw) : null;

    const startDateRaw = formData.get('saleStartDate');
    product.saleStartDate = (startDateRaw && startDateRaw !== "") ? new Date(startDateRaw) : null;

    const endDateRaw = formData.get('saleEndDate');
    product.saleEndDate = (endDateRaw && endDateRaw !== "") ? new Date(endDateRaw) : null;

    // 6. Tags
    product.tags = formData.getAll('tags');

    // 7. Images
    const keptImages = formData.getAll('keptImages'); 
    const imagesToDelete = product.images.filter(img => !keptImages.includes(img));
    for (const imgPath of imagesToDelete) await deleteFileFromPublic(imgPath);

    const newFiles = formData.getAll('newImages');
    const newPaths = [];
    for (const file of newFiles) {
      if (file.size > 0) {
        const path = await saveFileToPublic(file);
        if (path) newPaths.push(path);
      }
    }
    product.images = [...keptImages, ...newPaths];

    await product.save();
    revalidatePath('/admin/products'); 
    revalidatePath(`/product/${product.slug}`);
    
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: "SKU or Barcode already exists." };
    console.error("Update Product Error:", error);
    return { error: "Failed to update product" };
  }
}

export async function deleteProduct(id) {
  await connectDB();
  try {
    const product = await Product.findById(id);
    if(product.images) for(const img of product.images) await deleteFileFromPublic(img);
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: "Failed to delete" }; }
}

export async function getProductBySlug(slug) {
  await connectDB();
  try {
    let productRaw = await Product.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true })
      .populate('category')
      .populate('tags')
      .populate('sizeGuide') 
      .lean();
      
    if (!productRaw) return null;

    // Check Offer Expiry
    productRaw = await checkAndResetOffer(productRaw);

    return JSON.parse(JSON.stringify(productRaw));
  } catch (error) { return null; }
}

export async function getAllProducts() {
  await connectDB();
  let productsRaw = await Product.find().sort({ createdAt: -1 })
    .populate('category', 'name slug')
    .populate('tags', 'name')
    .lean();
  
  // Check Offers in Bulk
  productsRaw = await Promise.all(productsRaw.map(checkAndResetOffer));

  return JSON.parse(JSON.stringify(productsRaw));
}

export async function getRelatedProducts(categoryId, currentProductId) {
  await connectDB();
  try {
    let productsRaw = await Product.find({ category: categoryId, _id: { $ne: currentProductId } }).limit(4).lean();
    
    // Check Offers
    productsRaw = await Promise.all(productsRaw.map(checkAndResetOffer));

    return JSON.parse(JSON.stringify(productsRaw));
  } catch (error) { return []; }
}