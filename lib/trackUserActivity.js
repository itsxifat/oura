import User from '@/models/User';

/**
 * Records an IP and device fingerprint against a user account.
 *
 * De-duplication rules:
 *  - If the same IP was already seen within the last 24 hours → only update `lastSeen`
 *  - If the IP is new → push a new entry to `knownIps`
 *  - Same rules apply for `knownDevices`
 *
 * This is called on:
 *  1. Every purchase (createOrder / confirmPendingOrder)
 *  2. Site visits via POST /api/track (once every 24h per device/IP combo)
 *  3. Account creation (registration IP stored as `registrationIp`)
 *
 * All DB writes are fire-and-forget — never block the main request on failures.
 */
export async function trackUserActivity(userId, { ip, deviceId, userAgent = '' }) {
  if (!userId) return;
  try {
    const now    = new Date();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ops    = [];

    if (ip && ip !== 'unknown') {
      // Backfill registrationIp if the user was created without one
      ops.push(User.updateOne(
        { _id: userId, $or: [{ registrationIp: { $in: [null, '', undefined] } }, { registrationIp: { $exists: false } }] },
        { $set: { registrationIp: ip } }
      ));
      // Try to update lastSeen on an existing entry that hasn't been updated in 24h
      const ipUpdated = await User.updateOne(
        { _id: userId, 'knownIps.ip': ip, 'knownIps.lastSeen': { $lt: dayAgo } },
        { $set: { 'knownIps.$.lastSeen': now } }
      );
      // If nothing matched (either new IP or was already updated today) — push if truly new
      if (ipUpdated.matchedCount === 0) {
        ops.push(User.updateOne(
          { _id: userId, 'knownIps.ip': { $ne: ip } },
          { $push: { knownIps: { ip, firstSeen: now, lastSeen: now } } }
        ));
      }
    }

    if (deviceId) {
      const devUpdated = await User.updateOne(
        { _id: userId, 'knownDevices.deviceId': deviceId, 'knownDevices.lastSeen': { $lt: dayAgo } },
        { $set: { 'knownDevices.$.lastSeen': now, 'knownDevices.$.userAgent': userAgent } }
      );
      if (devUpdated.matchedCount === 0) {
        ops.push(User.updateOne(
          { _id: userId, 'knownDevices.deviceId': { $ne: deviceId } },
          { $push: { knownDevices: { deviceId, userAgent, firstSeen: now, lastSeen: now } } }
        ));
      }
    }

    if (ops.length) await Promise.all(ops);
  } catch {
    /* non-fatal — never interrupt an order over analytics */
  }
}
