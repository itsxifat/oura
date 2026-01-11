'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import SteadfastAccount from '@/models/SteadfastAccount';
import { performLogin } from './steadfastAuth'; // Auto-Login Logic

// --- CONFIG ---
const STEADFAST_CHECK_URL = (phone) => `https://www.steadfast.com.bd/user/frauds/check/${phone}`;

// --- HELPER: GET WORKING HEADERS (ROTATION LOGIC) ---
async function getWorkingHeaders(attempt = 0) {
  await connectDB();
  
  // 1. Get a valid account, sorted by 'lastUsed' to rotate usage
  // We prefer accounts that are marked 'isValid', but we pick 'lastUsed' oldest first.
  const account = await SteadfastAccount.findOne({ isValid: true }).sort({ lastUsed: 1 });

  if (!account) {
     // If no valid accounts, try to find ANY account and force login
     const anyAccount = await SteadfastAccount.findOne().sort({ updatedAt: 1 });
     if (!anyAccount) return null; // No accounts in system
     
     // Force Login
     const newCookies = await performLogin(anyAccount);
     if (newCookies) return { cookies: newCookies, accountId: anyAccount._id };
     return null; 
  }

  // 2. Update usage timestamp
  await SteadfastAccount.findByIdAndUpdate(account._id, { lastUsed: new Date() });

  return { cookies: account.cookies, accountId: account._id };
}

// --- HELPER: RISK CALCULATION ---
function calculateRisk(internal, steadfast) {
  // CRITICAL: Global Fraud List
  if (steadfast.frauds && steadfast.frauds.length > 0) {
      const details = steadfast.frauds[0].details || "Flagged in Global Database.";
      return { score: 0, level: 'Critical', suggestion: `BLACKLISTED: ${details.substring(0, 80)}...` };
  }

  // Internal
  const intTotal = internal.delivered + internal.returned;
  if (intTotal > 0 && (internal.returned / intTotal) > 0.5) {
      return { score: 20, level: 'High', suggestion: 'High Internal Return Rate.' };
  }

  // Steadfast Stats
  const sfTotal = (steadfast.total_delivered || 0) + (steadfast.total_cancelled || 0);
  
  if (sfTotal > 0) {
      const rate = Math.round((steadfast.total_delivered / sfTotal) * 100);
      if (rate < 40) return { score: 30, level: 'High', suggestion: `High Return Rate (${100 - rate}%) Globally.` };
      if (rate > 85) return { score: 95, level: 'Safe', suggestion: 'Excellent Courier History.' };
      return { score: rate, level: 'Medium', suggestion: `Global Success Rate: ${rate}%` };
  }

  return { score: 50, level: 'Neutral', suggestion: 'No History Found.' };
}

// --- MAIN ACTION ---
export async function checkFraud(phoneNumber) {
  const phone = phoneNumber.replace(/[^0-9]/g, "").slice(-11);

  const stats = {
    internal: { total: 0, delivered: 0, returned: 0 },
    steadfast: { total_delivered: 0, total_cancelled: 0, frauds: [] }
  };

  // 1. INTERNAL CHECK
  try {
    await connectDB();
    const orders = await Order.find({ "guestInfo.phone": { $regex: phone } }).select('status').lean();
    stats.internal.total = orders.length;
    stats.internal.delivered = orders.filter(o => o.status === 'Delivered').length;
    stats.internal.returned = orders.filter(o => o.status === 'Returned' || o.status === 'Cancelled').length;
  } catch (e) { console.error("Internal Check Failed", e); }

  // 2. STEADFAST ROTATION CHECK
  try {
    let session = await getWorkingHeaders();
    
    if (session) {
        let sfRes = await fetch(STEADFAST_CHECK_URL(phone), {
            headers: { 
                "Cookie": session.cookies,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        });

        // 🛑 IF AUTH FAILED (401/419) -> AUTO RE-LOGIN & RETRY
        if (sfRes.status === 401 || sfRes.status === 419) {
            console.log("⚠️ Cookies expired. Attempting auto-fix...");
            
            // Re-login specifically this account
            const account = await SteadfastAccount.findById(session.accountId);
            const newCookies = await performLogin(account);

            if (newCookies) {
                // Retry with new cookies
                sfRes = await fetch(STEADFAST_CHECK_URL(phone), {
                    headers: { 
                        "Cookie": newCookies,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        "Accept": "application/json"
                    }
                });
            } else {
                // If login failed, try getting a DIFFERENT account next time (recursion logic omitted for simplicity, returns empty for now)
                console.error("❌ Auto-fix failed.");
            }
        }

        if (sfRes.ok) {
            const sfData = await sfRes.json();
            stats.steadfast = {
                total_delivered: sfData.total_delivered || 0,
                total_cancelled: sfData.total_cancelled || 0,
                frauds: sfData.frauds || []
            };
        }
    } else {
        console.warn("No active Steadfast accounts found.");
    }
  } catch (e) { console.error("Steadfast Check Failed", e); }

  const analysis = calculateRisk(stats.internal, stats.steadfast);

  return { phone, ...analysis, sources: stats };
}