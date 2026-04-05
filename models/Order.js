import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
    },
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      method: {
        type: String,
        enum: ["inside", "outside"],
        default: "inside",
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,      // This will store the SOLD price (Discounted)
        basePrice: Number,  // ✅ ADDED: Stores the original price (for invoice display)
        quantity: Number,
        size: String,
        image: String,
        sku: String,
        barcode: String, 
      },
    ],
    subTotal: Number,
    discountAmount: Number,
    shippingFee: { type: Number, default: 0 },

    totalAmount: Number,
    couponCode: String,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
      default: "Pending",
    },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Pending" },
    paymentTransactionId: { type: String, default: null },
    // Gateway-specific payment details stored at callback time
    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    orderId: { type: String, unique: true },
    invoiceNumber: { type: String, unique: true, sparse: true },
    
    // Optional: For the Fraud Check feature later
    isHighRisk: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);