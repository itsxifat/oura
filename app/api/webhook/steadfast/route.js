import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.STEADFAST_WEBHOOK_SECRET;

// Constant-time comparison to prevent timing attacks
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    console.error('STEADFAST_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const headerList = await headers();
    const authHeader = headerList.get('authorization');

    if (!authHeader || !safeCompare(authHeader, `Bearer ${WEBHOOK_SECRET}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { invoice, status } = data;

    if (!invoice || typeof invoice !== 'string' || !status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Whitelist allowed courier statuses
    const STATUS_MAP = {
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      partial_delivered: 'Delivered',
      in_review: 'Shipped',
      pending: 'Shipped',
    };

    const newStatus = STATUS_MAP[status.toLowerCase()];
    if (!newStatus) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }

    await connectDB();

    await Order.findOneAndUpdate(
      { orderId: invoice },
      { courier_status: status, status: newStatus },
      { new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
