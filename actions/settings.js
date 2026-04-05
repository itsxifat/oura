'use server'

import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/security';

export async function updateSteadfastCookies(cookieJson) {
  await connectDB();
  try {
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

// ─── SHOP SETTINGS (public read, admin write) ─────────────────────────────────
export async function getShopSettings() {
  await connectDB();
  const settings = await Settings.find({
    key: { $in: ['delivery_pricing', 'payment_methods'] }
  }).lean();

  const result = {
    deliveryPricing: {
      insideDhaka: 80,
      outsideDhaka: 150,
      freeDelivery: false,
    },
    paymentMethods: {
      cashOnDelivery: true,
      bkash: false,
      sslcommerz: false,
    }
  };

  settings.forEach(s => {
    if (s.key === 'delivery_pricing') result.deliveryPricing = { ...result.deliveryPricing, ...s.value };
    if (s.key === 'payment_methods') result.paymentMethods = { ...result.paymentMethods, ...s.value };
  });

  return result;
}

export async function updateDeliveryPricing(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  const value = {
    insideDhaka: Math.max(0, Number(formData.get('insideDhaka') ?? 80)),
    outsideDhaka: Math.max(0, Number(formData.get('outsideDhaka') ?? 150)),
    freeDelivery: formData.get('freeDelivery') === 'true',
  };

  await Settings.findOneAndUpdate(
    { key: 'delivery_pricing' },
    { value },
    { upsert: true, new: true }
  );

  revalidatePath('/admin/settings');
  revalidatePath('/checkout');
  return { success: true };
}

export async function updatePaymentMethods(formData) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  const value = {
    cashOnDelivery: formData.get('cashOnDelivery') === 'true',
    bkash: formData.get('bkash') === 'true',
    sslcommerz: formData.get('sslcommerz') === 'true',
  };

  await Settings.findOneAndUpdate(
    { key: 'payment_methods' },
    { value },
    { upsert: true, new: true }
  );

  revalidatePath('/admin/settings');
  return { success: true };
}
