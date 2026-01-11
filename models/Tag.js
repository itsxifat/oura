import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  color: { type: String, default: '#000000' }, // Badge color (Hex code)
  description: { type: String },
}, { timestamps: true });

export default mongoose.models.Tag || mongoose.model('Tag', TagSchema);