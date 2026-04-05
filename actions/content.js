'use server'

import connectDB from '@/lib/db';
import Hero from '@/models/Hero';
import SiteContent from '@/models/SiteContent';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { assertAdmin, isValidObjectId } from '@/lib/security';

// --- HERO CAROUSEL (admin-only) ---
export async function addSlide(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  const imageFile = formData.get('image');
  const mobileImageFile = formData.get('mobileImage');

  if (!imageFile || imageFile.size === 0) return { error: 'Desktop image required' };

  try {
    const desktopPath = await saveFileToPublic(imageFile);
    if (!desktopPath) return { error: 'Failed to save desktop image' };

    let mobilePath = null;
    if (mobileImageFile && mobileImageFile.size > 0) mobilePath = await saveFileToPublic(mobileImageFile);

    // Only allow internal-relative links
    const rawLink = formData.get('link') || '/';
    const link = rawLink.startsWith('/') ? rawLink : '/';

    await Hero.create({ link, image: desktopPath, mobileImage: mobilePath });
    revalidatePath('/');
    revalidatePath('/admin/carousel');
    return { success: true };
  } catch (error) { return { error: 'Failed to save slide' }; }
}

export async function updateSlide(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  const id = formData.get('id');
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };

  const rawLink = formData.get('link') || '/';
  const link = rawLink.startsWith('/') ? rawLink : '/';
  const imageFile = formData.get('image');
  const mobileImageFile = formData.get('mobileImage');

  try {
    const slide = await Hero.findById(id);
    if (!slide) return { error: 'Slide not found' };

    slide.link = link;
    if (imageFile && imageFile.size > 0) {
      if (slide.image) await deleteFileFromPublic(slide.image);
      slide.image = await saveFileToPublic(imageFile);
    }
    if (mobileImageFile && mobileImageFile.size > 0) {
      if (slide.mobileImage) await deleteFileFromPublic(slide.mobileImage);
      slide.mobileImage = await saveFileToPublic(mobileImageFile);
    }

    await slide.save();
    revalidatePath('/'); revalidatePath('/admin/carousel');
    return { success: true };
  } catch (error) { return { error: 'Failed to update slide' }; }
}

export async function deleteSlide(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  try {
    const slide = await Hero.findById(id);
    if (!slide) return { error: 'Slide not found' };
    if (slide.image) await deleteFileFromPublic(slide.image);
    if (slide.mobileImage) await deleteFileFromPublic(slide.mobileImage);
    await Hero.findByIdAndDelete(id);
    revalidatePath('/'); revalidatePath('/admin/carousel');
    return { success: true };
  } catch (error) { return { error: 'Failed to delete slide' }; }
}

// --- NAVBAR ---
export async function saveNavbarConfig(links) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!Array.isArray(links)) return { error: 'Invalid links data' };
  await connectDB();
  try {
    await SiteContent.findOneAndUpdate(
      { identifier: 'main_layout' },
      { navbarLinks: links },
      { upsert: true, new: true }
    );
    revalidatePath('/');
    return { success: true };
  } catch (error) { return { error: 'Failed to save navbar' }; }
}

export async function getNavbarConfig() {
  await connectDB();
  try {
    const content = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
    if (!content?.navbarLinks) return { logoText: 'OURA', logoImage: '', links: [] };
    return { logoText: 'OURA', logoImage: '', links: JSON.parse(JSON.stringify(content.navbarLinks)) };
  } catch (error) { return { logoText: 'OURA', links: [] }; }
}
