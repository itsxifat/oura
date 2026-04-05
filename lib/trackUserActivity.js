import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Records an IP and device fingerprint against a user account.
 *
 * De-duplication:
 *  - Same IP/device seen within 24h → only updates `lastSeen`
 *  - New IP/device → pushes a new entry
 *  - Backfills registrationIp / registrationDeviceId if they were never set
 *
 * Called on: login, signup, every order, every site visit (24h dedup).
 * All DB writes are fire-and-forget — never blocks the main request.
 */
export async function trackUserActivity(userId, { ip, deviceId, userAgent = '' }) {
  if (!userId) return;
  try {
    await connectDB();

    const now    = new Date();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ops    = [];

    if (ip && ip !== 'unknown') {
      // Backfill registrationIp for users who were created without one.
      // Use $or to match null, empty string, or genuinely missing.
      ops.push(User.updateOne(
        { _id: userId, $or: [{ registrationIp: null }, { registrationIp: '' }] },
        { $set: { registrationIp: ip } }
      ));

      // Update lastSeen on an existing knownIps entry if it's stale (>24h)
      const ipUpdated = await User.updateOne(
        { _id: userId, 'knownIps.ip': ip, 'knownIps.lastSeen': { $lt: dayAgo } },
        { $set: { 'knownIps.$.lastSeen': now } }
      );
      // Push new IP entry only if this IP is not already in the array
      if (ipUpdated.matchedCount === 0) {
        ops.push(User.updateOne(
          { _id: userId, 'knownIps.ip': { $ne: ip } },
          { $push: { knownIps: { ip, firstSeen: now, lastSeen: now } } }
        ));
      }
    }

    if (deviceId) {
      // Backfill registrationDeviceId for users who were created without one
      ops.push(User.updateOne(
        { _id: userId, $or: [{ registrationDeviceId: null }, { registrationDeviceId: '' }] },
        { $set: { registrationDeviceId: deviceId } }
      ));

      // Update lastSeen + userAgent on existing knownDevices entry if stale
      const devUpdated = await User.updateOne(
        { _id: userId, 'knownDevices.deviceId': deviceId, 'knownDevices.lastSeen': { $lt: dayAgo } },
        { $set: { 'knownDevices.$.lastSeen': now, 'knownDevices.$.userAgent': userAgent } }
      );
      // Push new device entry only if not already present
      if (devUpdated.matchedCount === 0) {
        ops.push(User.updateOne(
          { _id: userId, 'knownDevices.deviceId': { $ne: deviceId } },
          { $push: { knownDevices: { deviceId, userAgent, firstSeen: now, lastSeen: now } } }
        ));
      }
    }

    if (ops.length) await Promise.all(ops);
  } catch {
    /* non-fatal — never interrupt an order or login over analytics */
  }
}
