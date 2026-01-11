'use server'

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

export async function signupAction(formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const password = formData.get('password');

  await connectDB();

  // 1. Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    return { error: "User already exists. Please login." };
  }

  // 2. Generate OTP (6 digits)
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // 3. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create or Update User
  if (existingUser && !existingUser.isVerified) {
    // Resend/Update existing unverified user
    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.phone = phone;
    existingUser.otp = otp;
    existingUser.otpExpiry = otpExpiry;
    await existingUser.save();
  } else {
    // Create new user
    await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
      provider: 'credentials'
    });
  }

  // 5. Send Email
  try {
    await sendOtpEmail(email, otp);
    return { success: true, email }; // Return email to pass to verify page
  } catch (error) {
    console.error(error);
    return { error: "Failed to send OTP email." };
  }
}

export async function verifyOtpAction(email, otp) {
  await connectDB();
  const user = await User.findOne({ email });

  if (!user) return { error: "User not found." };
  
  if (user.otp !== otp) return { error: "Invalid OTP." };
  if (new Date() > user.otpExpiry) return { error: "OTP Expired." };

  // Verify User
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return { success: true };
}