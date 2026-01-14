'use server'

import connectDB from '@/lib/db';
import SteadfastAccount from '@/models/SteadfastAccount';

const BASE_DOMAIN = "https://www.steadfast.com.bd";
const LOGIN_URL = `${BASE_DOMAIN}/login`;

function extractCookies(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return "";
  return raw.split(',').map(str => str.split(';')[0].trim()).join('; ');
}

function extractCsrfToken(html) {
  let match = html.match(/name="_token" value="([^"]+)"/);
  if (match) return match[1];
  match = html.match(/name="csrf-token" content="([^"]+)"/);
  if (match) return match[1];
  return null;
}

export async function performLogin(account) {
  try {
    console.log(`🔄 Attempting Login: ${account.email}...`);

    // 1. GET Login Page
    const getRes = await fetch(LOGIN_URL, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" },
        cache: 'no-store'
    });
    
    if (!getRes.ok) throw new Error("Could not reach login page");

    const initialCookies = extractCookies(getRes);
    const html = await getRes.text();
    const csrfToken = extractCsrfToken(html);

    if (!csrfToken) throw new Error("CSRF Token missing");

    // 2. POST Credentials
    const formData = new URLSearchParams();
    formData.append('_token', csrfToken);
    formData.append('email', account.email);
    formData.append('password', account.password);
    formData.append('remember', 'on'); 

    const postRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": initialCookies,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
            "Referer": LOGIN_URL,
            "Origin": BASE_DOMAIN,
        },
        body: formData,
        redirect: 'manual' // ⚠️ CRITICAL
    });

    // 3. VALIDATION LOGIC
    if (postRes.status === 302) {
        const location = postRes.headers.get('location');
        console.log(`📍 Redirect Location: ${location}`);

        // ❌ FAILURE CHECK: If it redirects BACK to login, the password was wrong
        if (location && location.includes('/login')) {
             throw new Error("Invalid Email or Password (Redirected to Login)");
        }

        // ✅ SUCCESS: Redirects anywhere else (usually /dashboard)
        const newCookies = extractCookies(postRes);
        const finalCookies = `${initialCookies}; ${newCookies}`;
        
        account.cookies = finalCookies;
        account.isValid = true;
        account.lastLogin = new Date();
        account.errorMsg = null;
        await account.save();
        
        console.log(`✅ Login Success: ${account.email}`);
        return finalCookies;
    } 
    
    // ❌ FAILURE: 200 OK (Stays on login page)
    else if (postRes.status === 200) {
        throw new Error("Invalid Email or Password");
    } 
    
    else {
        throw new Error(`Unexpected Server Status: ${postRes.status}`);
    }

  } catch (error) {
    console.error(`❌ Login Failed (${account.email}):`, error.message);
    
    account.isValid = false;
    account.errorMsg = error.message;
    await account.save();
    return null;
  }
}

// ... (Rest of your exports: addAccount, deleteAccount, etc. remain unchanged)
export async function addAccount(formData) {
  await connectDB();
  const email = formData.get('email');
  const password = formData.get('password');
  
  let account = await SteadfastAccount.findOne({ email });
  if (!account) {
      account = new SteadfastAccount({ email, password });
  } else {
      account.password = password;
      account.isValid = false; 
  }
  await account.save();
  
  const result = await performLogin(account);
  
  // CRITICAL: Throw error if login failed so frontend sees it
  if(!result) {
      throw new Error("Authentication Failed");
  }
  
  return { success: true };
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