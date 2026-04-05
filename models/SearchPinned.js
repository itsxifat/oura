import mongoose from 'mongoose';

const SearchPinnedSchema = new mongoose.Schema({
  keyword: { type: String, required: true, trim: true, maxlength: 100 },
  order: { type: Number, default: 0 }, // lower = shown first
  createdAt: { type: Date, default: Date.now },
});

SearchPinnedSchema.index({ order: 1, createdAt: 1 });

export default mongoose.models.SearchPinned || mongoose.model('SearchPinned', SearchPinnedSchema);
