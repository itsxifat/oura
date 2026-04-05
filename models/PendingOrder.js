import mongoose from 'mongoose';

const PendingOrderSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isGuest:  { type: Boolean, default: false },
  guestInfo: {
    firstName: String, lastName: String, email: String,
    phone: String, address: String, city: String, postalCode: String,
  },
  shippingAddress: {
    address: String, city: String, postalCode: String,
    method: { type: String, enum: ['inside', 'outside'], default: 'inside' },
  },
  items: [{
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:      String,
    price:     Number,
    basePrice: Number,
    quantity:  Number,
    size:      String,
    image:     String,
    sku:       String,
    barcode:   String,
  }],
  subTotal:       Number,
  discountAmount: Number,
  shippingFee:    Number,
  couponCode:     String,
  totalAmount:    Number,
  paymentMethod:  String,
  saveAddress:    Boolean,
  // TTL: auto-delete after 2 hours if not confirmed
  createdAt: { type: Date, default: Date.now, expires: 7200 },
});

export default mongoose.models.PendingOrder
  || mongoose.model('PendingOrder', PendingOrderSchema);
