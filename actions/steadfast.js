'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const BASE_URL  = "https://portal.packzy.com/api/v1";
const API_KEY    = process.env.STEADFAST_API_KEY;
const SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

const getHeaders = () => ({
  'Api-Key': API_KEY,
  'Secret-Key': SECRET_KEY,
  'Content-Type': 'application/json',
});

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

function cleanInvoiceId(id) {
  return id.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Maps Steadfast courier_status → Order.status
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

// ─── 1. SEND SINGLE ORDER ────────────────────────────────────────────────────
export async function sendToSteadfast(orderId) {
  if (!API_KEY || !SECRET_KEY) return { error: 'Server Configuration Error: Missing API Keys' };

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return { error: 'Order not found' };

  const safeInvoiceId = cleanInvoiceId(order.orderId);

  const payload = {
    invoice:            safeInvoiceId,
    recipient_name:     `${order.guestInfo.firstName} ${order.guestInfo.lastName}`.trim(),
    recipient_phone:    order.guestInfo.phone,
    recipient_address:  `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
    cod_amount:         order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
    note:               'Handle with care',
    delivery_type:      0,
  };

  try {
    const res      = await fetch(`${BASE_URL}/create_order`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    const rawText  = await res.text();
    let data;
    try { data = JSON.parse(rawText); } catch { return { error: 'Invalid JSON response from courier' }; }

    if (data.status === 200) {
      order.consignment_id    = data.consignment.consignment_id;
      order.tracking_code     = data.consignment.tracking_code;
      order.steadfast_invoice = safeInvoiceId;
      order.status            = 'Shipped';
      order.courier_status    = 'in_review';
      order.courier_synced_at = new Date();
      await order.save();
      revalidatePath('/admin/orders');
      return { success: true, tracking_code: data.consignment.tracking_code };
    }

    const errorMsg = data.errors ? JSON.stringify(data.errors) : (data.message || 'Unknown Error');
    return { error: `Courier Error: ${errorMsg}` };
  } catch (error) {
    return { error: 'API Connection Failed' };
  }
}

// ─── 2. BULK SHIP ────────────────────────────────────────────────────────────
export async function bulkShipToSteadfast() {
  await connectDB();
  const orders = await Order.find({ status: 'Processing', consignment_id: { $exists: false } }).limit(500);
  if (orders.length === 0) return { error: 'No orders to ship.' };

  const payloadData = orders.map(order => ({
    invoice:            cleanInvoiceId(order.orderId),
    recipient_name:     `${order.guestInfo.firstName} ${order.guestInfo.lastName}`.trim(),
    recipient_address:  `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
    recipient_phone:    order.guestInfo.phone,
    cod_amount:         order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
    note:               'Bulk Shipment',
  }));

  try {
    const res      = await fetch(`${BASE_URL}/create_order/bulk-order`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ data: JSON.stringify(payloadData) }) });
    const response = JSON.parse(await res.text());

    let successCount = 0;
    if (Array.isArray(response)) {
      for (const item of response) {
        if (item.status === 'success') {
          const sentOrder = orders.find(o => cleanInvoiceId(o.orderId) === item.invoice);
          if (sentOrder) {
            sentOrder.status            = 'Shipped';
            sentOrder.consignment_id    = item.consignment_id;
            sentOrder.tracking_code     = item.tracking_code;
            sentOrder.steadfast_invoice = cleanInvoiceId(sentOrder.orderId);
            sentOrder.courier_status    = 'in_review';
            sentOrder.courier_synced_at = new Date();
            await sentOrder.save();
            successCount++;
          }
        }
      }
    }

    revalidatePath('/admin/orders');
    return { success: true, count: successCount };
  } catch (error) {
    return { error: 'Bulk Ship Failed' };
  }
}

// ─── 3. SYNC SINGLE ORDER STATUS ─────────────────────────────────────────────
export async function syncOrderCourierStatus(orderDbId) {
  await connectDB();
  const order = await Order.findById(orderDbId);
  if (!order || !order.consignment_id) return { error: 'Order not found or not shipped.' };

  try {
    const res = await fetch(`${BASE_URL}/status_by_cid/${order.consignment_id}`, {
      headers: getHeaders(),
      next: { revalidate: 0 },
    });
    if (!res.ok) return { error: 'Steadfast API error' };

    const data = await res.json();
    if (data.status !== 200) return { error: 'Could not fetch status' };

    const courierStatus = (data.delivery_status || '').toLowerCase();
    const newStatus     = STATUS_MAP[courierStatus] || order.status;

    if (order.courier_status !== courierStatus || order.status !== newStatus) {
      order.courier_status    = courierStatus;
      order.status            = newStatus;
      order.courier_synced_at = new Date();
      await order.save();
      revalidatePath('/admin/orders');
      revalidatePath('/account/orders');
      revalidatePath(`/delivery-status/${encodeURIComponent(order.orderId.replace('#', ''))}`);
    }

    return {
      success:        true,
      courier_status: courierStatus,
      status:         newStatus,
      synced_at:      order.courier_synced_at,
    };
  } catch (error) {
    return { error: 'Sync failed: ' + error.message };
  }
}

// ─── 4. SYNC ALL USER ORDERS (delivery-status page) ─────────────────────────
export async function syncAllUserOrders() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  if (!userId) return [];

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

  const updatedOrders = await Promise.all(orders.map(async (order) => {
    if (order.consignment_id && order.status !== 'Delivered' && order.status !== 'Cancelled') {
      try {
        const res = await fetch(`${BASE_URL}/status_by_cid/${order.consignment_id}`, {
          headers: getHeaders(),
          next: { revalidate: 0 },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 200) {
            const courierStatus = (data.delivery_status || '').toLowerCase();
            const newStatus     = STATUS_MAP[courierStatus] || order.status;
            if (order.courier_status !== courierStatus) {
              order.courier_status    = courierStatus;
              order.status            = newStatus;
              order.courier_synced_at = new Date();
              await order.save();
            }
          }
        }
      } catch { /* non-fatal */ }
    }
    return order;
  }));

  return serialize(updatedOrders);
}

// ─── 5. GET PUBLIC ORDER STATUS (for delivery-status/[orderId] page) ─────────
export async function getOrderStatus(rawOrderId) {
  await connectDB();

  // Accept with or without # prefix, case-insensitive
  const cleanId = rawOrderId.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
  const order = await Order.findOne({
    $or: [
      { orderId: rawOrderId },
      { orderId: `#${cleanId}` },
      { orderId: cleanId },
      { steadfast_invoice: cleanId },
    ],
  })
  .select('orderId status courier_status tracking_code consignment_id items createdAt guestInfo shippingAddress courier_synced_at paymentMethod')
  .lean();

  if (!order) return null;

  // Sync status if in transit
  if (order.consignment_id && order.status !== 'Delivered' && order.status !== 'Cancelled') {
    try {
      const res = await fetch(`${BASE_URL}/status_by_cid/${order.consignment_id}`, {
        headers: getHeaders(),
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 200) {
          const courierStatus = (data.delivery_status || '').toLowerCase();
          const newStatus     = STATUS_MAP[courierStatus] || order.status;
          if (order.courier_status !== courierStatus) {
            await Order.findByIdAndUpdate(order._id, {
              courier_status: courierStatus,
              status: newStatus,
              courier_synced_at: new Date(),
            });
            order.courier_status    = courierStatus;
            order.status            = newStatus;
            order.courier_synced_at = new Date();
          }
        }
      }
    } catch { /* non-fatal — return stale data */ }
  }

  return serialize(order);
}
