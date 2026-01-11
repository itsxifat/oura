import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  
  // Pricing
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  saleStartDate: { type: Date },     
  saleEndDate: { type: Date },       
  
  // --- FIX: ADDED ROOT INVENTORY FIELDS ---
  // We need these because your UI has global SKU/Barcode/Stock inputs
  stock: { type: Number, default: 0 }, 
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, unique: true, sparse: true },

  // Variant Inventory
  variants: [{
    size: { type: String, required: true },
    stock: { type: Number, default: 0 },
    // You can keep variant-specific SKU if needed later, but UI uses global for now
    sku: { type: String } 
  }],

  // Relationships
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  sizeGuide: { type: mongoose.Schema.Types.ObjectId, ref: 'SizeGuide' },

  images: [{ type: String }],
  
  // Stats
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);