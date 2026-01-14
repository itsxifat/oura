'use server'

import connectDB from '@/lib/db';
import Hero from '@/models/Hero';
import SiteContent from '@/models/SiteContent';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

// --- HERO CAROUSEL ---
export async function addSlide(formData) {
  await connectDB();
  const imageFile = formData.get('image'); 
  const mobileImageFile = formData.get('mobileImage');

  if (!imageFile || imageFile.size === 0) return { error: 'Desktop Image required' };

  try {
    const desktopPath = await saveFileToPublic(imageFile);
    let mobilePath = null;
    if (mobileImageFile && mobileImageFile.size > 0) mobilePath = await saveFileToPublic(mobileImageFile);

    await Hero.create({
      link: formData.get('link') || '/',
      image: desktopPath,
      mobileImage: mobilePath
    });
    revalidatePath('/');
    revalidatePath('/admin/carousel');
    return { success: true };
  } catch (error) { return { error: 'Failed to save slide' }; }
}

export async function updateSlide(formData) {
  await connectDB();
  const id = formData.get('id');
  const link = formData.get('link');
  const imageFile = formData.get('image'); 
  const mobileImageFile = formData.get('mobileImage');

  try {
    const slide = await Hero.findById(id);
    if (!slide) return { error: "Slide not found" };

    slide.link = link || '/';
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
  } catch (error) { return { error: "Failed to update slide" }; }
}

export async function deleteSlide(id) {
  await connectDB();
  try {
    const slide = await Hero.findById(id);
    if (!slide) return { error: "Slide not found" };
    if (slide.image) await deleteFileFromPublic(slide.image);
    if (slide.mobileImage) await deleteFileFromPublic(slide.mobileImage);
    await Hero.findByIdAndDelete(id);
    revalidatePath('/'); revalidatePath('/admin/carousel');
    return { success: true };
  } catch (error) { return { error: "Failed to delete slide" }; }
}

// --- NAVBAR ---
export async function saveNavbarConfig(links) {
  await connectDB();
  try {
    await SiteContent.findOneAndUpdate({ identifier: 'main_layout' }, { navbarLinks: links }, { upsert: true, new: true });
    revalidatePath('/'); 
    return { success: true };
  } catch (error) { return { error: 'Failed to save navbar' }; }
}

export async function getNavbarConfig() {
  await connectDB();
  try {
    const content = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
    if (!content || !content.navbarLinks) return { logoText: 'OURA', logoImage: '', links: [] };
    return { logoText: 'OURA', logoImage: '', links: JSON.parse(JSON.stringify(content.navbarLinks)) };
  } catch (error) { return { logoText: 'OURA', links: [] }; }
}