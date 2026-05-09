import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Order from '@/models/Order'

export async function POST(req) {
  try {
    const { event, params, clientId, orderId } = await req.json()

    let eventParams = params || {}

    // For purchase events with an orderId, enrich with full order data from MongoDB
    if (orderId && event === 'purchase') {
      try {
        await connectDB()
        const order = await Order.findOne({ orderId }).lean()
        if (order) {
          eventParams = {
            transaction_id: order.orderId,
            currency: 'BDT',
            value: order.totalAmount,
            items: (order.items || []).map(i => ({
              item_id: String(i.product || i._id || ''),
              item_name: i.name || '',
              price: i.price || 0,
              quantity: i.quantity || 1,
            })),
          }
        }
      } catch { /* non-fatal — proceed with provided params */ }
    }

    const response = await fetch('https://gtm.oura-lifestyle.com/g/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId || 'server-' + Date.now(),
        events: [{ name: event, params: eventParams }],
      }),
    })

    return NextResponse.json({ ok: response.ok })
  } catch (error) {
    console.error('GTM tracking error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
