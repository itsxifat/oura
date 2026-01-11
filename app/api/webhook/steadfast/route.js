import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const WEBHOOK_SECRET = process.env.STEADFAST_WEBHOOK_SECRET;

export async function POST(req) {
  console.log("--- 📥 STEADFAST WEBHOOK RECEIVED ---");

  try {
    // 1. Log Headers for Auth Debugging
    const headerList = await headers();
    const authHeader = headerList.get('authorization');
    
    console.log("Header - Authorization:", authHeader);
    console.log("Expected - Bearer:", WEBHOOK_SECRET);

    // 2. Authentication Check
    if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error("❌ AUTHENTICATION FAILED: Token mismatch or missing secret.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse and Log Request Body
    const data = await req.json();
    console.log("📦 Webhook Payload:", JSON.stringify(data, null, 2));

    const { invoice, status } = data;

    if (invoice && status) {
      await connectDB();

      // Mapping Status
      let newStatus = 'Processing';
      if (status === 'delivered') newStatus = 'Delivered';
      if (status === 'cancelled') newStatus = 'Cancelled';
      if (status === 'partial_delivered') newStatus = 'Delivered';
      if (status === 'in_review' || status === 'pending') newStatus = 'Shipped';

      console.log(`🔄 Updating Order ${invoice}: Courier Status [${status}] -> App Status [${newStatus}]`);

      // 4. Update Database
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: invoice },
        {
          courier_status: status,
          status: newStatus
        },
        { new: true } // returns the updated document
      );

      if (updatedOrder) {
        console.log(`✅ SUCCESS: Order ${invoice} updated in database.`);
      } else {
        console.warn(`⚠️ WARNING: Order ${invoice} not found in database. Check if invoice ID matches.`);
      }
    } else {
      console.warn("⚠️ MISSING DATA: 'invoice' or 'status' fields not found in payload.");
    }

    console.log("--- 📤 WEBHOOK PROCESSED SUCCESSFULLY ---");
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ WEBHOOK CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }
}