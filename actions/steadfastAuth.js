'use server'

import connectDB from '@/lib/db';
import SteadfastAccount from '@/models/SteadfastAccount';

// ✅ CORRECT LOGIN URL
const BASE_DOMAIN = "https://www.steadfast.com.bd";
const LOGIN_URL = `${BASE_DOMAIN}/login`;

// --- HELPER: Parse Set-Cookie Headers ---
function extractCookies(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return "";
  return raw.split(',')
    .map(str => str.split(';')[0].trim())
    .join('; ');
}

// --- HELPER: Extract CSRF Token (Multi-pattern) ---
function extractCsrfToken(html) {
  // 1. Input field (Standard)
  let match = html.match(/name="_token" value="([^"]+)"/);
  if (match) return match[1];

  // 2. Meta tag (Common in Laravel)
  match = html.match(/name="csrf-token" content="([^"]+)"/);
  if (match) return match[1];

  // 3. JavaScript var (Fallback)
  match = html.match(/csrfToken\s*=\s*['"]([^'"]+)['"]/);
  if (match) return match[1];

  return null;
}

// --- CORE: LOGIN LOGIC ---
export async function performLogin(account) {
  try {
    console.log(`🔄 Logging in: ${account.email} at ${LOGIN_URL}...`);

    // 1. GET Login Page (To establish Session & get CSRF)
    const getRes = await fetch(LOGIN_URL, {
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Connection": "keep-alive"
        },
        cache: 'no-store'
    });
    
    if (!getRes.ok) throw new Error(`Login Page Unreachable (Status: ${getRes.status})`);

    const initialCookies = extractCookies(getRes);
    const html = await getRes.text();
    const csrfToken = extractCsrfToken(html);

    if (!csrfToken) {
        // Log a small snippet to debug structure if it fails again
        console.error("❌ CSRF Missing. Page Preview:", html.substring(0, 300));
        throw new Error("CSRF Token could not be found on login page.");
    }

    // 2. POST Credentials
    const formData = new URLSearchParams();
    formData.append('_token', csrfToken);
    formData.append('email', account.email);
    formData.append('password', account.password);
    
    // Add "Remember Me" if the form supports it (usually 'remember' or 'remember_me')
    formData.append('remember', 'on'); 

    const postRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": initialCookies,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": LOGIN_URL,
            "Origin": BASE_DOMAIN,
            "Upgrade-Insecure-Requests": "1"
        },
        body: formData,
        redirect: 'manual' // Required to capture the Set-Cookie from the 302 Redirect
    });

    // 3. Handle Response
    // 302 Found = Success (Redirects to dashboard)
    if (postRes.status === 302 || postRes.status === 200) {
        const newCookies = extractCookies(postRes);
        
        // Merge cookies (Initial Session + New Auth Token)
        const finalCookies = `${initialCookies}; ${newCookies}`;
        
        // Check if we actually got a session cookie (usually 'steadfast_session' or similar)
        if (!finalCookies.includes('session') && !finalCookies.includes('token')) {
             console.warn("⚠️ Warning: No session cookie found in response. Login might have failed silently.");
        }

        // Save to DB
        account.cookies = finalCookies;
        account.isValid = true;
        account.lastLogin = new Date();
        account.errorMsg = null;
        await account.save();
        
        console.log(`✅ Login Success: ${account.email}`);
        return finalCookies;
    } else {
        // If 422 (Validation Error) or 401 (Unauthorized)
        throw new Error(`Login Failed (Status: ${postRes.status}). Check credentials.`);
    }

  } catch (error) {
    console.error(`❌ Login Fatal Error (${account.email}):`, error.message);
    
    // Update DB to reflect failure
    account.isValid = false;
    account.errorMsg = error.message;
    await account.save();
    return null;
  }
}

// --- PUBLIC ACTIONS (Same as before) ---

export async function addAccount(formData) {
  await connectDB();
  try {
    const email = formData.get('email');
    const password = formData.get('password');
    
    let account = await SteadfastAccount.findOne({ email });
    if (!account) {
        account = new SteadfastAccount({ email, password });
    } else {
        account.password = password;
        account.isValid = false; // Reset validity on password change
    }
    await account.save();
    
    // Attempt Login
    await performLogin(account);
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Database Error" };
  }
}

export async function deleteAccount(id) {
  await connectDB();
  await SteadfastAccount.findByIdAndDelete(id);
  return { success: true };
}

export async function refreshAllAccounts() {
  await connectDB();
  const accounts = await SteadfastAccount.find({});
  for (const acc of accounts) {
    await performLogin(acc);
  }
  return { success: true };
}

export async function getAccounts() {
  await connectDB();
  const accounts = await SteadfastAccount.find({}).sort({ updatedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(accounts));
}