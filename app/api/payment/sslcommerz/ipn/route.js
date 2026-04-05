/**
 * SSL Commerz IPN (Instant Payment Notification)
 * Server-to-server notification from SSL Commerz.
 * tran_id here is our pendingId (same as sent in the original payment init).
 */

import { NextResponse } from 'next/server';
import { confirmPendingOrder } from '@/actions/orders';

const IS_LIVE  = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

export async function POST(request) {
  try {
    const formData  = await request.formData();
    const valId     = formData.get('val_id');
    const pendingId = formData.get('tran_id');
    const status    = formData.get('status');

    if (status !== 'VALID' && status !== 'VALIDATED') {
      return NextResponse.json({ received: true });
    }

    if (!valId || !pendingId) {
      return NextResponse.json({ received: true });
    }

    // Re-validate
    const validateUrl = `${BASE_URL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWD}&format=json`;
    const validateRes  = await fetch(validateUrl);
    const validateData = await validateRes.json();

    if (validateData.status !== 'VALID' && validateData.status !== 'VALIDATED') {
      return NextResponse.json({ received: true });
    }

    // confirmPendingOrder is idempotent — safe to call even if callback already ran
    await confirmPendingOrder(pendingId, {
      gateway: 'SSLCommerz',
      paymentTransactionId: valId,
      valId,
      bankTranId:  validateData.bank_tran_id  || formData.get('bank_tran_id'),
      cardType:    validateData.card_type      || formData.get('card_type'),
      cardNo:      validateData.card_no        || formData.get('card_no'),
      cardIssuer:  validateData.card_issuer    || formData.get('card_issuer'),
      amount:      validateData.amount         || formData.get('amount'),
      storeAmount: validateData.store_amount   || formData.get('store_amount'),
      currency:    validateData.currency       || formData.get('currency'),
      tranDate:    validateData.tran_date      || formData.get('tran_date'),
      status:      validateData.status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('SSL Commerz IPN error:', error);
    return NextResponse.json({ received: true });
  }
}
