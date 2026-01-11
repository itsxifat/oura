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

export async function updateUserProfile(formData) {
  await connectDB();
  const email = formData.get('email');
  try {
    const user = await User.findOne({ email });
    if (!user) return { error: "User not found" };

    if (formData.get('name')) user.name = formData.get('name');
    if (formData.get('phone')) user.phone = formData.get('phone');

    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const { iv, content } = encryptBuffer(Buffer.from(bytes));
      user.profilePicture = { data: content, iv: iv, contentType: imageFile.type };
      user.image = null; 
    }
    await user.save();
    revalidatePath('/account'); revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error) { return { error: "Failed to update profile" }; }
}

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

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { success: false, error: "Incorrect current password" };

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return { success: true };
}

export async function initiateEmailChange(formData) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };
  const password = formData.get('password');
  const newEmail = formData.get('newEmail');

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (user.password) {
      if (!password) return { success: false, error: "Password required" };
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return { success: false, error: "Incorrect password" };
  }
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) return { success: false, error: "Email is already in use" };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailChangeOTP = otp;
  user.emailChangeOTPExpires = new Date(Date.now() + 10 * 60 * 1000); 
  user.pendingNewEmail = newEmail;
  await user.save();
  try { await sendOtpEmail(newEmail, otp); } catch (error) { return { success: false, error: "Failed to send OTP email" }; }
  return { success: true };
}

export async function verifyEmailChangeOTP(formData) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };
  const otp = formData.get('otp');
  const newEmail = formData.get('newEmail');

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user || user.pendingNewEmail !== newEmail) return { success: false, error: "Invalid request" };
  if (user.emailChangeOTP !== otp || user.emailChangeOTPExpires < new Date()) return { success: false, error: "Invalid or expired OTP" };

  user.email = newEmail;
  user.emailChangeOTP = undefined;
  user.emailChangeOTPExpires = undefined;
  user.pendingNewEmail = undefined;
  await user.save();
  return { success: true };
}