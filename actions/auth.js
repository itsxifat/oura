'use server'

import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signAdminToken, authOptions } from '@/lib/auth'; 
import { encryptBuffer } from '@/lib/encryption';   
import { getServerSession } from "next-auth";
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/email'; 
import { revalidatePath } from 'next/cache';

// --- ADMIN LOGIN ---
export async function loginAction(formData) {
  const password = formData.get('password');
  if (password === process.env.ADMIN_PASSWORD) {
    const token = await signAdminToken();
    const cookieStore = await cookies(); 
    cookieStore.set('admin_session', token, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, sameSite: 'strict' 
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid Password' };
}

// --- PROFILE UPDATE ---
export async function updateUserProfile(formData) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    // Find user by Session Email (Secure)
    const user = await User.findOne({ email: session.user.email });
    if (!user) return { error: "User not found" };

    if (formData.get('name')) user.name = formData.get('name');
    if (formData.get('phone')) user.phone = formData.get('phone');

    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const { iv, content } = encryptBuffer(Buffer.from(bytes));
      user.profilePicture = { data: content, iv: iv, contentType: imageFile.type };
      user.image = null; // Clear OAuth image if custom one is uploaded
    }
    
    await user.save();
    revalidatePath('/account'); 
    return { success: true };
  } catch (error) { 
    console.error(error);
    return { error: "Failed to update profile" }; 
  }
}

// --- PASSWORD CHANGE (Hybrid Support) ---
export async function changePassword(formData) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (newPassword !== confirmPassword) return { success: false, error: "Passwords do not match" };
  if (newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters" };

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return { success: false, error: "User not found" };

  // ✅ FIX: Hybrid Account Logic
  // Only require current password IF the user actually has one set.
  // This allows Google-only users to SET a password for the first time.
  if (user.password && user.password.length > 0) {
      if (!currentPassword) return { success: false, error: "Current password required" };
      
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return { success: false, error: "Incorrect current password" };
  }

  // Hash and save new password
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  
  return { success: true };
}

// --- EMAIL CHANGE: STEP 1 (Initiate) ---
export async function initiateEmailChange(formData) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const password = formData.get('password');
  const newEmail = formData.get('newEmail')?.toLowerCase().trim(); // Normalize

  if (!newEmail) return { success: false, error: "New email is required" };
  if (newEmail === session.user.email) return { success: false, error: "Please enter a different email" };

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return { success: false, error: "User not found" };

  // ✅ FIX: Only verify password if user HAS one
  if (user.password && user.password.length > 0) {
      if (!password) return { success: false, error: "Password required to change email" };
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return { success: false, error: "Incorrect password" };
  }

  // Check if new email is taken
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) return { success: false, error: "Email is already in use" };

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save OTP to DB
  user.emailChangeOTP = otp;
  user.emailChangeOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  user.pendingNewEmail = newEmail;
  
  await user.save();

  // Send Email
  try { 
      await sendOtpEmail(newEmail, otp, 'email_change'); 
  } catch (error) { 
      console.error("Email Error:", error);
      return { success: false, error: "Failed to send OTP email" }; 
  }

  return { success: true };
}

// --- EMAIL CHANGE: STEP 2 (Verify) ---
export async function verifyEmailChangeOTP(formData) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const otp = formData.get('otp');
  const newEmail = formData.get('newEmail')?.toLowerCase().trim();

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  
  if (!user) return { success: false, error: "User not found" };

  // --- DEBUGGING LOGS (Check your terminal) ---
  console.log("Input OTP:", otp);
  console.log("DB OTP:", user.emailChangeOTP);
  console.log("Input Email:", newEmail);
  console.log("DB Pending Email:", user.pendingNewEmail); // This is likely undefined if Schema is wrong

  if (!user.pendingNewEmail || user.pendingNewEmail !== newEmail) {
      return { success: false, error: "Invalid request: Email mismatch or not found." };
  }
  
  if (user.emailChangeOTP !== otp) return { success: false, error: "Invalid OTP" };
  if (user.emailChangeOTPExpires < new Date()) return { success: false, error: "OTP Expired" };

  // Apply Change
  user.email = newEmail;
  user.emailChangeOTP = undefined;
  user.emailChangeOTPExpires = undefined;
  user.pendingNewEmail = undefined;
  
  await user.save();
  
  return { success: true };
}