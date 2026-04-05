import mongoose from 'mongoose';

/**
 * OrderAttempt — audit log of every order action per IP/device/user.
 * Auto-deleted after 48 hours via MongoDB TTL index.
 * Used to detect and auto-block abuse patterns (stock exhaustion, fake orders).
 */
const OrderAttemptSchema = new mongoose.Schema({
  ip:             { type: String, index: true },
  deviceId:       { type: String, index: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userAgent:      { type: String },
  type: {
    type: String,
    enum: [
      'order_created',    // COD order successfully placed
      'pending_created',  // Online payment pending order created (stock reserved)
      'stock_fail',       // Tried to buy but stock was insufficient
      'payment_success',  // Payment confirmed, real order created
      'payment_fail',     // Payment gateway returned failure
      'payment_cancel',   // User cancelled at gateway
    ],
    required: true,
  },
  productIds:     [String],        // product IDs involved in this attempt
  pendingOrderId: { type: String },
  createdAt:      { type: Date, default: Date.now, expires: 172800 }, // 48h TTL
});

export default mongoose.models.OrderAttempt || mongoose.model('OrderAttempt', OrderAttemptSchema);
