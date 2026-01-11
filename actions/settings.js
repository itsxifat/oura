'use server'

import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';

export async function updateSteadfastCookies(cookieJson) {
  await connectDB();
  try {
    // Upsert (Update if exists, Insert if new)
    await Settings.findOneAndUpdate(
        { key: 'steadfast_cookies' },
        { value: cookieJson },
        { upsert: true, new: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Cookie Update Failed:", error);
    return { error: "Failed" };
  }
}