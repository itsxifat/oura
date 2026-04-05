import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

const WEBHOOK_SECRET = process.env.STEADFAST_WEBHOOK_SECRET;

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Maps Steadfast delivery_status → our Order.status
const STATUS_MAP = {
  delivered:          'Delivered',
  partial_delivered:  'Delivered',
  cancelled:          'Cancelled',
  in_review:          'Shipped',
  pending:            'Shipped',
  in_transit:         'Shipped',
  out_for_delivery:   'Shipped',
  hold:               'Shipped',
  pending_return:     'Cancelled',
};

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    console.error('[Steadfast Webhook] STEADFAST_WEBHOOK_SECRET not configured');
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

    const courierStatus = status.toLowerCase();
    const newStatus = STATUS_MAP[courierStatus];
    if (!newStatus) {
      console.warn(`[Steadfast Webhook] Unknown status: ${status}`);
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }

    await connectDB();

    // Try multiple lookup strategies:
    // 1. By steadfast_invoice (clean ID we stored when shipping)
    // 2. By orderId exact match
    // 3. By orderId with # prefix (e.g. invoice="OL-1001" → orderId="#OL-1001")
    const cleanInvoice = invoice.replace(/[^a-zA-Z0-9-_]/g, '');
    const updated = await Order.findOneAndUpdate(
      {
        $or: [
          { steadfast_invoice: invoice },
          { steadfast_invoice: cleanInvoice },
          { orderId: invoice },
          { orderId: `#${cleanInvoice}` },
          { orderId: cleanInvoice },
        ],
      },
      {
        courier_status: courierStatus,
        status: newStatus,
        courier_synced_at: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      console.error(`[Steadfast Webhook] Order not found for invoice: ${invoice}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    revalidatePath('/delivery-status');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Steadfast Webhook] Error:', error.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
