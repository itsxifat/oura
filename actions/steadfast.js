'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User'; // ✅ FIXED: Added missing import
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth'; 
import { revalidatePath } from 'next/cache';

const BASE_URL = "https://portal.packzy.com/api/v1";
const API_KEY = process.env.STEADFAST_API_KEY;
const SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

// --- DEBUG LOGGER ---
const log = (msg, data) => console.log(`\n📦 [STEADFAST-DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : '');

const getHeaders = () => ({
  'Api-Key': API_KEY,
  'Secret-Key': SECRET_KEY,
  'Content-Type': 'application/json'
});

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// Removes # or any special char not allowed by Steadfast
function cleanInvoiceId(id) {
    return id.replace(/[^a-zA-Z0-9-_]/g, ''); 
}

// --- 1. SEND SINGLE ORDER (Admin Action) ---
export async function sendToSteadfast(orderId) {
  log(`🚀 STARTING SHIPMENT for Order ID: ${orderId}`);

  if (!API_KEY || !SECRET_KEY) {
      log("❌ ERROR: Missing API Keys in .env file.");
      return { error: "Server Configuration Error: Missing API Keys" };
  }

  await connectDB();
  const order = await Order.findById(orderId);
  
  if (!order) {
      log("❌ ERROR: Order not found in Database.");
      return { error: "Order not found" };
  }

  const safeInvoiceId = cleanInvoiceId(order.orderId);

  const payload = {
    invoice: safeInvoiceId,
    recipient_name: `${order.guestInfo.firstName} ${order.guestInfo.lastName}`,
    recipient_phone: order.guestInfo.phone,
    recipient_address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
    cod_amount: order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
    note: "Handle with care",
    delivery_type: 0
  };

  log("📝 Payload Prepared:", payload);

  try {
    const res = await fetch(`${BASE_URL}/create_order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const rawText = await res.text();
    log(`📩 API Response Status: ${res.status}`);
    log(`📄 API Raw Body:`, rawText);

    let data;
    try { data = JSON.parse(rawText); } catch (e) { return { error: "Invalid JSON response" }; }

    if (data.status === 200) {
      log("✅ SUCCESS! Consignment Created:", data.consignment);
      
      order.consignment_id = data.consignment.consignment_id;
      order.tracking_code = data.consignment.tracking_code;
      order.status = 'Shipped'; 
      order.courier_status = 'in_review';
      await order.save();
      
      revalidatePath('/admin/orders');
      return { success: true, tracking_code: data.consignment.tracking_code };
    } else {
      const errorMsg = data.errors ? JSON.stringify(data.errors) : (data.message || "Unknown Error");
      log("❌ API REJECTED REQUEST:", errorMsg);
      return { error: `Courier Error: ${errorMsg}` };
    }
  } catch (error) {
    log("❌ NETWORK EXCEPTION:", error.message);
    return { error: "API Connection Failed" };
  }
}

// --- 2. BULK SHIP (Admin Action) ---
export async function bulkShipToSteadfast() {
  log("🚀 STARTING BULK SHIPMENT...");
  await connectDB();
  
  const orders = await Order.find({ status: 'Processing', consignment_id: { $exists: false } }).limit(500);
  log(`Found ${orders.length} eligible orders.`);

  if (orders.length === 0) return { error: "No orders to ship." };

  const payloadData = orders.map(order => ({
    invoice: cleanInvoiceId(order.orderId),
    recipient_name: `${order.guestInfo.firstName} ${order.guestInfo.lastName}`,
    recipient_address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
    recipient_phone: order.guestInfo.phone,
    cod_amount: order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
    note: "Bulk Shipment"
  }));

  try {
    const res = await fetch(`${BASE_URL}/create_order/bulk-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data: JSON.stringify(payloadData) }) 
    });

    const rawText = await res.text();
    log(`📩 Bulk API Response:`, rawText);
    const response = JSON.parse(rawText);

    let successCount = 0;
    if (Array.isArray(response)) {
        for (const item of response) {
            if (item.status === 'success') {
                const sentOrder = orders.find(o => cleanInvoiceId(o.orderId) === item.invoice);
                if (sentOrder) {
                    sentOrder.status = 'Shipped';
                    sentOrder.consignment_id = item.consignment_id;
                    sentOrder.tracking_code = item.tracking_code;
                    sentOrder.courier_status = 'in_review';
                    await sentOrder.save();
                    successCount++;
                }
            }
        }
    }
    
    revalidatePath('/admin/orders');
    return { success: true, count: successCount };
  } catch (error) { 
    log("❌ BULK SHIP EXCEPTION:", error.message);
    return { error: "Bulk Ship Failed" }; 
  }
}

// --- 3. SYNC & GET USER ORDERS (User Action) ---
export async function syncAllUserOrders() {
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return [];

  let userId = session.user.id;
  if (!userId && session.user.email) {
    // ✅ User model is now correctly defined via import
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
                  next: { revalidate: 0 } 
              });
              if(res.ok) {
                  const data = await res.json();
                  if (data.status === 200) {
                      const deliveryStatus = data.delivery_status;
                      let newLocalStatus = order.status;
                      if (deliveryStatus === 'delivered' || deliveryStatus === 'partial_delivered') newLocalStatus = 'Delivered';
                      if (deliveryStatus === 'cancelled') newLocalStatus = 'Cancelled';

                      if (order.courier_status !== deliveryStatus) {
                          order.courier_status = deliveryStatus;
                          order.status = newLocalStatus;
                          await order.save();
                      }
                  }
              }
          } catch (e) {
              console.error("Sync fetch error:", e.message);
          }
      }
      return order;
  }));

  return serialize(updatedOrders);
}