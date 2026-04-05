import mongoose from 'mongoose';

const SearchLogSchema = new mongoose.Schema({
  query: { type: String, required: true, trim: true, maxlength: 200 },
  createdAt: { type: Date, default: Date.now },
});

// Index for fast aggregation + time-based cleanup
SearchLogSchema.index({ query: 1 });
SearchLogSchema.index({ createdAt: 1 });

export default mongoose.models.SearchLog || mongoose.model('SearchLog', SearchLogSchema);
