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
  
  // Root Inventory
  stock: { type: Number, default: 0 }, 
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, unique: true, sparse: true },

  // Variants
  variants: [{
    size: { type: String, required: true },
    stock: { type: Number, default: 0 },
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
  
  // --- ✅ FIX: ADD MISSING FIELDS HERE ---
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    // Add these so Mongoose saves them:
    orderId: { type: String }, // Links review to specific order
    editCount: { type: Number, default: 0 }, // Tracks edits (Max 3)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
  }]
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);