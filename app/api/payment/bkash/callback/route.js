/**
 * bKash Payment Callback
 * Called by bKash after the user completes (or cancels) payment.
 * Query params: paymentID, status
 */

import { NextResponse } from 'next/server';
import { confirmPendingOrder } from '@/actions/orders';

const BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentID = searchParams.get('paymentID');
  const status    = searchParams.get('status');
  const siteUrl   = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (status === 'cancel' || status === 'failure') {
    return NextResponse.redirect(`${siteUrl}/payment/fail?reason=${status}&gateway=bkash`);
  }

  if (!paymentID) {
    return NextResponse.redirect(`${siteUrl}/payment/fail?reason=missing_id&gateway=bkash`);
  }

  try {
    const tokenData = await getToken();
    if (!tokenData.id_token) {
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=token_error&gateway=bkash`);
    }

    // Execute the payment
    const execRes = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: tokenData.id_token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });

    const execData = await execRes.json();

    if (execData.statusCode !== '0000') {
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=execution_failed&gateway=bkash`);
    }

    // pendingId was passed as merchantInvoiceNumber
    const pendingId = execData.merchantInvoiceNumber;
    if (!pendingId) {
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=missing_id&gateway=bkash`);
    }

    const result = await confirmPendingOrder(pendingId, {
      gateway: 'bKash',
      paymentTransactionId: execData.trxID,
      trxID: execData.trxID,
      paymentID: execData.paymentID,
      amount: execData.amount,
      currency: execData.currency,
      customerMsisdn: execData.customerMsisdn,
      transactionStatus: execData.transactionStatus,
      paymentExecuteTime: execData.paymentExecuteTime,
      payerReference: execData.payerReference,
      merchantInvoiceNumber: execData.merchantInvoiceNumber,
    });

    if (!result.success) {
      console.error('bKash confirmPendingOrder failed:', result.error);
      return NextResponse.redirect(`${siteUrl}/payment/fail?reason=order_error&gateway=bkash`);
    }

    return NextResponse.redirect(`${siteUrl}/payment/success?orderId=${encodeURIComponent(result.orderId)}&gateway=bkash`);
  } catch (error) {
    console.error('bKash callback error:', error);
    return NextResponse.redirect(`${siteUrl}/payment/fail?reason=server_error&gateway=bkash`);
  }
}
