'use server';

import mongoose from 'mongoose';
import SizeGuide from '@/models/SizeGuide';
import GlobalSetting from '@/models/GlobalSetting';
import { revalidatePath } from 'next/cache';
import { assertAdmin, isValidObjectId, sanitizeString } from '@/lib/security';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// Read-only — no auth needed
export async function getSizesData() {
  try {
    await connectDB();
    const guides = await SizeGuide.find().sort({ createdAt: -1 }).lean();
    const setting = await GlobalSetting.findOne({ identifier: 'master_sizes' }).lean();
    const masterSizes = setting?.value || [];
    return {
      success: true,
      guides: JSON.parse(JSON.stringify(guides)),
      masterSizes: JSON.parse(JSON.stringify(masterSizes))
    };
  } catch (error) {
    console.error('Fetch Error:', error);
    return { success: false, guides: [], masterSizes: [] };
  }
}

export async function updateMasterSizes(sizesArray) {
  try { await assertAdmin(); } catch { return { success: false, error: 'Unauthorized' }; }
  try {
    await connectDB();
    if (!Array.isArray(sizesArray)) return { success: false, error: 'Invalid data' };
    // Validate each size is a plain string
    const safeSizes = sizesArray
      .filter(s => typeof s === 'string')
      .map(s => sanitizeString(s, 50))
      .filter(Boolean);

    await GlobalSetting.findOneAndUpdate(
      { identifier: 'master_sizes' },
      { identifier: 'master_sizes', value: safeSizes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    console.error('Save Sizes Error:', error);
    return { success: false, error: 'Failed to save sizes' };
  }
}

export async function upsertSizeGuide(data) {
  try { await assertAdmin(); } catch { return { success: false, error: 'Unauthorized' }; }
  try {
    await connectDB();
    const { _id, name, columns, rows } = data;
    const safeName = sanitizeString(name, 100);
    if (!safeName) return { success: false, error: 'Name is required' };

    if (_id && _id !== 'new') {
      if (!isValidObjectId(_id)) return { success: false, error: 'Invalid ID' };
      await SizeGuide.findByIdAndUpdate(_id, { name: safeName, columns, rows });
    } else {
      await SizeGuide.create({ name: safeName, columns, rows });
    }
    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    console.error('Save Guide Error:', error);
    return { success: false, error: 'Failed to save guide' };
  }
}

export async function removeSizeGuide(id) {
  try { await assertAdmin(); } catch { return { success: false, error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid ID' };
  try {
    await connectDB();
    await SizeGuide.findByIdAndDelete(id);
    revalidatePath('/admin/sizes');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete' };
  }
}
