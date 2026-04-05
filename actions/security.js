'use server';

import connectDB from '@/lib/db';
import BlockList from '@/models/BlockList';
import OrderAttempt from '@/models/OrderAttempt';
import User from '@/models/User';
import { assertAdmin } from '@/lib/security';

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// ─── Internal helpers (not exported — used by orders.js) ──────────────────────

/**
 * Returns true if the given ip, deviceId, or userId is currently blocked.
 * Checks expiry: expired blocks are treated as not blocked (TTL index handles deletion).
 */
export async function isBlocked(ip, deviceId, userId) {
  await connectDB();
  const now = new Date();
  const checks = [];
  if (ip      && ip      !== 'unknown') checks.push({ type: 'ip',     value: ip });
  if (deviceId && deviceId !== '')      checks.push({ type: 'device',  value: deviceId });
  if (userId)                           checks.push({ type: 'user',    value: String(userId) });
  if (!checks.length) return false;

  const block = await BlockList.findOne({
    $and: [
      { $or: checks },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  }).lean();
  return !!block;
}

/**
 * Records one order attempt and auto-blocks the IP/device if abuse thresholds are exceeded.
 * Call this after every order action (success, failure, cancel).
 */
export async function trackAttempt({ ip, deviceId, userId, userAgent, type, productIds = [], pendingOrderId }) {
  await connectDB();
  try {
    await OrderAttempt.create({ ip, deviceId, userId, userAgent, type, productIds, pendingOrderId });
  } catch { /* non-fatal — never block ordering on audit failure */ }

  // Auto-block check only on suspicious failure patterns
  if (type !== 'stock_fail' && type !== 'payment_fail' && type !== 'payment_cancel') return;

  try {
    const window1h = new Date(Date.now() - 60 * 60 * 1000);
    const orFilter = [];
    if (ip && ip !== 'unknown') orFilter.push({ ip });
    if (deviceId)               orFilter.push({ deviceId });
    if (!orFilter.length) return;

    // Count stock failures in the last hour for this IP or device
    const failCount = await OrderAttempt.countDocuments({
      $or: orFilter,
      type: 'stock_fail',
      createdAt: { $gte: window1h },
    });

    // Auto-block threshold: 8 stock failures in 1 hour
    if (failCount >= 8) {
      const expires24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const reason = `Auto-blocked: ${failCount} stock-fail attempts within 1 hour`;
      const ops = [];
      if (ip && ip !== 'unknown') {
        ops.push(BlockList.findOneAndUpdate(
          { type: 'ip', value: ip },
          { $set: { reason, attempts: failCount, blockedBy: 'system', expiresAt: expires24h } },
          { upsert: true }
        ));
      }
      if (deviceId) {
        ops.push(BlockList.findOneAndUpdate(
          { type: 'device', value: deviceId },
          { $set: { reason, attempts: failCount, blockedBy: 'system', expiresAt: expires24h } },
          { upsert: true }
        ));
      }
      await Promise.all(ops);
    }
  } catch { /* non-fatal */ }
}

// ─── Admin: view suspicious activity ─────────────────────────────────────────

export async function getRecentAttempts(limitPerType = 50) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [failures, cancels, all] = await Promise.all([
    OrderAttempt.find({ type: 'stock_fail', createdAt: { $gte: since } })
      .sort({ createdAt: -1 }).limit(limitPerType).lean(),
    OrderAttempt.find({ type: { $in: ['payment_fail', 'payment_cancel'] }, createdAt: { $gte: since } })
      .sort({ createdAt: -1 }).limit(limitPerType).lean(),
    // Top abusers by IP
    OrderAttempt.aggregate([
      { $match: { type: 'stock_fail', createdAt: { $gte: since } } },
      { $group: { _id: '$ip', count: { $sum: 1 }, deviceIds: { $addToSet: '$deviceId' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return serialize({ failures, cancels, topAbusers: all });
}

// ─── Admin: manage block list ─────────────────────────────────────────────────

export async function getBlockList() {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  const blocks = await BlockList.find().sort({ createdAt: -1 }).limit(200).lean();
  return serialize(blocks);
}

export async function blockEntity({ type, value, reason = '', durationHours = null }) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!['ip', 'device', 'user'].includes(type)) return { error: 'Invalid type' };
  if (!value?.trim()) return { error: 'Value required' };
  await connectDB();

  const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
  const doc = await BlockList.findOneAndUpdate(
    { type, value: value.trim() },
    { $set: { reason, blockedBy: 'admin', expiresAt } },
    { upsert: true, new: true }
  );

  // If blocking a user account, also set isBanned on the User doc
  if (type === 'user') {
    await User.findByIdAndUpdate(value.trim(), { isBanned: true }).catch(() => {});
  }

  return { success: true, block: serialize(doc) };
}

export async function unblockEntity({ type, value }) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  await BlockList.deleteOne({ type, value });

  if (type === 'user') {
    await User.findByIdAndUpdate(value, { isBanned: false }).catch(() => {});
  }
  return { success: true };
}
