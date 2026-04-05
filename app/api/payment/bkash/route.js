/**
 * bKash Payment Gateway Integration
 *
 * Required .env variables:
 *   BKASH_APP_KEY       - bKash app key
 *   BKASH_APP_SECRET    - bKash app secret
 *   BKASH_USERNAME      - bKash username
 *   BKASH_PASSWORD      - bKash password
 *   BKASH_BASE_URL      - https://tokenized.sandbox.bka.sh/v1.2.0-beta (sandbox)
 *                         https://tokenized.pay.bka.sh/v1.2.0-beta (production)
 *
 * Flow: Create Payment → Execute Payment → Verify Payment
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';

const BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

async function isEnabled() {
  await connectDB();
  const s = await Settings.findOne({ key: 'payment_methods' }).lean();
  return s?.value?.bkash === true;
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: process.env.BKASH_USERNAME,
      password: process.env.BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
  });
  return res.json();
}

// POST /api/payment/bkash — create payment
export async function POST(request) {
  if (!(await isEnabled())) {
    return NextResponse.json({ error: 'bKash payment is not enabled.' }, { status: 403 });
  }

  try {
    const { amount, orderId, callbackURL } = await request.json();
    if (!amount || !orderId) {
      return NextResponse.json({ error: 'amount and orderId are required.' }, { status: 400 });
    }

    const tokenData = await getToken();
    if (!tokenData.id_token) {
      return NextResponse.json({ error: 'bKash token failed.' }, { status: 500 });
    }

    const createRes = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: tokenData.id_token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: orderId,
        callbackURL: callbackURL || `${process.env.NEXTAUTH_URL}/api/payment/bkash/callback`,
        amount: String(amount),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId,
      }),
    });

    const data = await createRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('bKash create error:', error);
    return NextResponse.json({ error: 'bKash payment creation failed.' }, { status: 500 });
  }
}
