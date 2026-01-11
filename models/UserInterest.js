import mongoose from 'mongoose';

const UserInterestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Logged in user
  guestId: { type: String, required: false }, // Non-logged in user (cookie)
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  interactionType: { type: String, enum: ['view', 'cart', 'search'], required: true },
  score: { type: Number, default: 1 }, // view=1, cart=3, buy=5
  createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-delete after 30 days
});

export default mongoose.models.UserInterest || mongoose.model('UserInterest', UserInterestSchema);