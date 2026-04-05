/**
 * SSL Commerz Payment Gateway Integration
 *
 * Required .env variables:
 *   SSLCOMMERZ_STORE_ID     - Store ID from SSL Commerz
 *   SSLCOMMERZ_STORE_PASSWD - Store password from SSL Commerz
 *   SSLCOMMERZ_IS_LIVE      - 'true' for production, 'false' for sandbox
 *
 * Flow: Init Payment → Redirect to SSL → Callback → Validate IPN
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';

const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

async function isEnabled() {
  await connectDB();
  const s = await Settings.findOne({ key: 'payment_methods' }).lean();
  return s?.value?.sslcommerz === true;
}

// POST /api/payment/sslcommerz — initiate payment session
export async function POST(request) {
  if (!(await isEnabled())) {
    return NextResponse.json({ error: 'SSL Commerz payment is not enabled.' }, { status: 403 });
  }

  try {
    const { amount, orderId, customerName, customerEmail, customerPhone, customerAddress } = await request.json();
    if (!amount || !orderId) {
      return NextResponse.json({ error: 'amount and orderId are required.' }, { status: 400 });
    }

    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const params = new URLSearchParams({
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
      total_amount: String(amount),
      currency: 'BDT',
      tran_id: orderId,
      success_url: `${siteUrl}/api/payment/sslcommerz/callback?status=success`,
      fail_url: `${siteUrl}/api/payment/sslcommerz/callback?status=fail`,
      cancel_url: `${siteUrl}/api/payment/sslcommerz/callback?status=cancel`,
      ipn_url: `${siteUrl}/api/payment/sslcommerz/ipn`,
      cus_name: customerName || 'Customer',
      cus_email: customerEmail || 'noreply@oura.com',
      cus_add1: customerAddress || 'N/A',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: customerPhone || '01700000000',
      shipping_method: 'Courier',
      ship_name: customerName || 'Customer',
      ship_add1: customerAddress || 'N/A',
      ship_city: 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
      product_name: 'Order',
      product_category: 'Clothing',
      product_profile: 'general',
    });

    const res = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const rawText = await res.text();
    console.log('[SSLCommerz] HTTP status:', res.status);
    console.log('[SSLCommerz] Raw response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[SSLCommerz] Non-JSON response from gateway');
      return NextResponse.json({ error: 'Invalid response from SSL Commerz.' }, { status: 500 });
    }

    if (data.status === 'SUCCESS') {
      return NextResponse.json({ redirectURL: data.GatewayPageURL });
    } else {
      console.error('[SSLCommerz] Init failed:', data);
      return NextResponse.json({ error: data.failedreason || 'SSL Commerz init failed.' }, { status: 500 });
    }
  } catch (error) {
    console.error('[SSLCommerz] init error:', error);
    return NextResponse.json({ error: 'SSL Commerz payment initiation failed.' }, { status: 500 });
  }
}
