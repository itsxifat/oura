import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  // If automatic, code can be system-generated or hidden
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, required: true }, 
  
  isAutomatic: { type: Boolean, default: false }, // NEW: Apply without user input
  
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true }, 
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  
  minSpend: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 0 },
  
  // Scope: Categories OR Specific Products
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], 
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // NEW
  
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  
  usageLimit: { type: Number, default: 10000 }, 
  usedCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);