'use server';

import mongoose from 'mongoose';
import SizeGuide from '@/models/SizeGuide';
import GlobalSetting from '@/models/GlobalSetting'; // New model
import { revalidatePath } from 'next/cache';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// --- FETCH DATA ---
export async function getSizesData() {
  try {
    await connectDB();
    
    // 1. Get Size Guides
    const guides = await SizeGuide.find().sort({ createdAt: -1 }).lean();

    // 2. Get Master Sizes (Defaults to empty array if not found)
    const setting = await GlobalSetting.findOne({ identifier: 'master_sizes' }).lean();
    const masterSizes = setting?.value || [];

    return { 
      success: true, 
      guides: JSON.parse(JSON.stringify(guides)), 
      masterSizes: JSON.parse(JSON.stringify(masterSizes)) 
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, guides: [], masterSizes: [] };
  }
}

// --- UPDATE MASTER SIZES ---
export async function updateMasterSizes(sizesArray) {
  try {
    await connectDB();
    
    // Force array type
    const safeSizes = Array.isArray(sizesArray) ? sizesArray : [];

    await GlobalSetting.findOneAndUpdate(
      { identifier: 'master_sizes' },
      { identifier: 'master_sizes', value: safeSizes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    console.error("Save Sizes Error:", error);
    return { success: false, error: "Failed to save sizes" };
  }
}

// --- SAVE SIZE GUIDE ---
export async function upsertSizeGuide(data) {
  try {
    await connectDB();
    const { _id, name, columns, rows } = data;

    if (!name) return { success: false, error: "Name is required" };

    if (_id && _id !== 'new') {
      await SizeGuide.findByIdAndUpdate(_id, { name, columns, rows });
    } else {
      await SizeGuide.create({ name, columns, rows });
    }

    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    console.error("Save Guide Error:", error);
    return { success: false, error: "Failed to save guide" };
  }
}

// --- DELETE GUIDE ---
export async function removeSizeGuide(id) {
  try {
    await connectDB();
    await SizeGuide.findByIdAndDelete(id);
    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}