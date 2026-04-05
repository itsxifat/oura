import mongoose from 'mongoose';

/**
 * BlockList — stores blocked IPs, device fingerprints, and user accounts.
 * Used to prevent stock exhaustion attacks and fraudulent order attempts.
 */
const BlockListSchema = new mongoose.Schema({
  type:      { type: String, enum: ['ip', 'device', 'user'], required: true },
  value:     { type: String, required: true },          // the IP / deviceId / userId string
  reason:    { type: String, default: '' },
  attempts:  { type: Number, default: 0 },             // how many bad attempts triggered this
  blockedBy: { type: String, enum: ['system', 'admin'], default: 'system' },
  expiresAt: { type: Date, default: null },             // null = permanent
}, { timestamps: true });

// Compound unique index so we can't accidentally double-block the same entity
BlockListSchema.index({ type: 1, value: 1 }, { unique: true });

// TTL index: if expiresAt is set, MongoDB removes the document automatically
BlockListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export default mongoose.models.BlockList || mongoose.model('BlockList', BlockListSchema);
