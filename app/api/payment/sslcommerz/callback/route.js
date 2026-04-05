/**
 * SSL Commerz Payment Callback
 * Called by SSL Commerz after payment success, fail, or cancel.
 * Query params: status (success | fail | cancel)
 * POST body: val_id, tran_id, amount, currency, etc.
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

export async function POST(request) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (status === 'fail' || status === 'cancel') {
    return NextResponse.redirect(`${siteUrl}/payment/fail?reason=${status}&gateway=sslcommerz`);
  }

  try {
    const formData = await request.formData();
    const valId    = formData.get('val_id');
    const tranId   = formData.get('tran_id');   // this is our orderId
    const amount   = formData.get('amount');
    const currency = formData.get('currency');

    if (!valId || !tranId) {
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=missing_params&gateway=sslcommerz`);
    }

    // Validate the transaction with SSL Commerz
    const validateUrl = `${BASE_URL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWD}&format=json`;
    const validateRes = await fetch(validateUrl);
    const validateData = await validateRes.json();

    if (
      validateData.status !== 'VALID' &&
      validateData.status !== 'VALIDATED'
    ) {
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=validation_failed&gateway=sslcommerz`);
    }

    // Update order + store full gateway details
    await connectDB();
    const orderId = tranId;
    await Order.findOneAndUpdate(
      { orderId },
      {
        paymentStatus: 'Paid',
        paymentTransactionId: valId,
        paymentDetails: {
          gateway: 'SSLCommerz',
          valId,
          bankTranId: validateData.bank_tran_id || formData.get('bank_tran_id'),
          cardType: validateData.card_type || formData.get('card_type'),
          cardNo: validateData.card_no || formData.get('card_no'),
          cardIssuer: validateData.card_issuer || formData.get('card_issuer'),
          amount: validateData.amount || amount,
          storeAmount: validateData.store_amount || formData.get('store_amount'),
          currency: validateData.currency || currency,
          tranDate: validateData.tran_date || formData.get('tran_date'),
          status: validateData.status,
        },
      }
    );

    return NextResponse.redirect(`${siteUrl}/payment/success?orderId=${orderId}&gateway=sslcommerz`);
  } catch (error) {
    console.error('SSL Commerz callback error:', error);
    return NextResponse.redirect(`${siteUrl}/payment/fail?reason=server_error&gateway=sslcommerz`);
  }
}
