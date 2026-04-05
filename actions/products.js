'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { assertAdmin, sanitizeString, isValidObjectId } from '@/lib/security';

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

async function checkAndResetOffer(product) {
  if (!product.saleEndDate) return product;
  const now = new Date();
  if (now > new Date(product.saleEndDate)) {
    await Product.findByIdAndUpdate(product._id, {
      $unset: { discountPrice: "", saleStartDate: "", saleEndDate: "" }
    });
    product.discountPrice = null;
    product.saleStartDate = null;
    product.saleEndDate = null;
  }
  return product;
}

// --- TAGS (admin-only writes) ---
export async function getTags() {
  await connectDB();
  const tags = await Tag.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(tags));
}

export async function createTag(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  try {
    const name = sanitizeString(formData.get('name'), 100);
    if (!name) return { error: 'Tag name is required' };
    const color = sanitizeString(formData.get('color'), 20);
    const slug = generateSlug(name);
    await Tag.create({ name, slug, color });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Tag already exists' }; }
}

export async function deleteTag(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  try {
    await Tag.findByIdAndDelete(id);
    await Product.updateMany({ tags: id }, { $pull: { tags: id } });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Failed to delete' }; }
}

export async function getProductsByTag(tagId) {
  if (!isValidObjectId(tagId)) return [];
  await connectDB();
  const products = await Product.find({ tags: tagId }).select('name price images sku').lean();
  return JSON.parse(JSON.stringify(products));
}

// --- CATEGORIES (admin-only writes) ---
export async function createCategory(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  const name = sanitizeString(formData.get('name'), 100);
  if (!name) return { error: 'Category name is required' };
  const parentId = formData.get('parentId') || null;
  if (parentId && !isValidObjectId(parentId)) return { error: 'Invalid parent ID' };
  const imageFile = formData.get('image');
  const slug = name.toLowerCase().replace(/ /g, '-');

  try {
    let imagePath = null;
    if (imageFile && imageFile.size > 0) imagePath = await saveFileToPublic(imageFile);
    await Category.create({ name, slug, parent: parentId, image: imagePath });
    revalidatePath('/admin/categories'); revalidatePath('/admin/navbar'); revalidatePath('/category');
    return { success: true };
  } catch (error) { return { error: 'Failed to create category' }; }
}

export async function deleteCategory(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
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
  if (!isValidObjectId(id)) return null;
  await connectDB();
  try {
    let product = await Product.findById(id).populate('category').populate('tags').lean();
    if (!product) return null;
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
  try { await assertAdmin(); } catch { return []; }
  await connectDB();
  const productsRaw = await Product.find().sort({ createdAt: -1 }).populate('category', 'name').populate('tags', 'name color').lean();
  return JSON.parse(JSON.stringify(productsRaw));
}

export async function updateProductTags(productId, tags) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(productId)) return { error: 'Invalid ID' };
  if (!Array.isArray(tags) || tags.some(t => !isValidObjectId(t))) return { error: 'Invalid tag IDs' };
  await connectDB();
  try {
    await Product.findByIdAndUpdate(productId, { tags });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: 'Failed to update tags' }; }
}

export async function createProduct(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  try {
    const name = sanitizeString(formData.get('name'), 200);
    if (!name) return { error: 'Product name is required' };

    const description = sanitizeString(formData.get('description'), 5000);
    const category = formData.get('category');
    if (!category || !isValidObjectId(category)) return { error: 'Valid category is required' };

    const price = parseFloat(formData.get('price'));
    if (isNaN(price) || price < 0) return { error: 'Valid price is required' };

    let variants = [];
    const variantsJson = formData.get('variants');
    if (variantsJson) {
      try { variants = JSON.parse(variantsJson); } catch { return { error: 'Invalid variants data' }; }
      if (!Array.isArray(variants)) return { error: 'Variants must be an array' };
    }

    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : Math.max(0, parseInt(formData.get('stock') || 0));

    const sizeGuideRaw = formData.get('sizeGuide');
    const sizeGuide = (sizeGuideRaw && isValidObjectId(sizeGuideRaw)) ? sizeGuideRaw : undefined;

    const discountPriceRaw = formData.get('discountPrice');
    const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null;
    if (discountPrice !== null && (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
      return { error: 'Discount price must be positive and less than price' };
    }

    const startDateRaw = formData.get('saleStartDate');
    const saleStartDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDateRaw = formData.get('saleEndDate');
    const saleEndDate = endDateRaw ? new Date(endDateRaw) : null;

    let sku = sanitizeString(formData.get('sku'), 50);
    if (sku === 'AUTO' || !sku) sku = generateCode('SKU');

    let barcode = sanitizeString(formData.get('barcode'), 50);
    if (barcode === 'AUTO' || !barcode) barcode = generateCode('BAR');

    const tags = formData.getAll('tags').filter(t => isValidObjectId(t));
    const images = formData.getAll('images');
    const imagePaths = [];

    for (const file of images) {
      if (file.size > 0) {
        const p = await saveFileToPublic(file);
        if (p) imagePaths.push(p);
      }
    }

    const slug = generateSlug(name) + '-' + crypto.randomUUID().slice(0, 8);

    await Product.create({
      name, slug, sku, barcode, description, price,
      discountPrice, saleStartDate, saleEndDate,
      category, stock: totalStock, variants, sizeGuide, tags,
      images: imagePaths
    });

    revalidatePath('/admin/products');
    revalidatePath('/product');
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: 'SKU or Barcode already exists.' };
    if (error.name === 'CastError') return { error: 'Invalid data format.' };
    console.error('Create Product Error:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  try {
    const id = formData.get('id');
    if (!isValidObjectId(id)) return { error: 'Invalid product ID' };

    const product = await Product.findById(id);
    if (!product) return { error: 'Product not found' };

    const name = sanitizeString(formData.get('name'), 200);
    if (!name) return { error: 'Product name is required' };

    product.name = name;
    product.description = sanitizeString(formData.get('description'), 5000);

    const price = parseFloat(formData.get('price'));
    if (isNaN(price) || price < 0) return { error: 'Valid price is required' };
    product.price = price;

    const category = formData.get('category');
    if (!isValidObjectId(category)) return { error: 'Valid category is required' };
    product.category = category;

    const variantsJson = formData.get('variants');
    if (variantsJson) {
      let parsed;
      try { parsed = JSON.parse(variantsJson); } catch { return { error: 'Invalid variants data' }; }
      if (!Array.isArray(parsed)) return { error: 'Variants must be an array' };
      product.variants = parsed;
      product.stock = parsed.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } else {
      product.stock = Math.max(0, parseInt(formData.get('stock') || product.stock));
    }

    const sizeGuide = formData.get('sizeGuide');
    product.sizeGuide = (sizeGuide && isValidObjectId(sizeGuide)) ? sizeGuide : undefined;

    const sku = sanitizeString(formData.get('sku'), 50);
    if (sku === 'AUTO') product.sku = generateCode('SKU');
    else if (sku) product.sku = sku;

    const barcode = sanitizeString(formData.get('barcode'), 50);
    if (barcode === 'AUTO') product.barcode = generateCode('BAR');
    else if (barcode) product.barcode = barcode;

    const discountPriceRaw = formData.get('discountPrice');
    product.discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null;

    const startDateRaw = formData.get('saleStartDate');
    product.saleStartDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDateRaw = formData.get('saleEndDate');
    product.saleEndDate = endDateRaw ? new Date(endDateRaw) : null;

    product.tags = formData.getAll('tags').filter(t => isValidObjectId(t));

    const keptImages = formData.getAll('keptImages').filter(img => typeof img === 'string' && img.startsWith('/uploads/'));
    const imagesToDelete = product.images.filter(img => !keptImages.includes(img));
    for (const imgPath of imagesToDelete) await deleteFileFromPublic(imgPath);

    const newFiles = formData.getAll('newImages');
    const newPaths = [];
    for (const file of newFiles) {
      if (file.size > 0) {
        const p = await saveFileToPublic(file);
        if (p) newPaths.push(p);
      }
    }
    product.images = [...keptImages, ...newPaths];

    await product.save();
    revalidatePath('/admin/products');
    revalidatePath(`/product/${product.slug}`);
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: 'SKU or Barcode already exists.' };
    console.error('Update Product Error:', error);
    return { error: 'Failed to update product' };
  }
}

export async function deleteProduct(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  try {
    const product = await Product.findById(id);
    if (!product) return { error: 'Product not found' };
    if (product.images) for (const img of product.images) await deleteFileFromPublic(img);
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: 'Failed to delete' }; }
}

export async function getProductBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const safeSlug = sanitizeString(slug, 200);
  await connectDB();
  try {
    let productRaw = await Product.findOneAndUpdate(
      { slug: safeSlug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('category').populate('tags').populate('sizeGuide').lean();

    if (!productRaw) return null;
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
  productsRaw = await Promise.all(productsRaw.map(checkAndResetOffer));
  return JSON.parse(JSON.stringify(productsRaw));
}

export async function getRelatedProducts(categoryId, currentProductId) {
  if (!isValidObjectId(categoryId) || !isValidObjectId(currentProductId)) return [];
  await connectDB();
  try {
    let productsRaw = await Product.find({ category: categoryId, _id: { $ne: currentProductId } }).limit(4).lean();
    productsRaw = await Promise.all(productsRaw.map(checkAndResetOffer));
    return JSON.parse(JSON.stringify(productsRaw));
  } catch (error) { return []; }
}
