'use server'

import connectDB from '@/lib/db';
import User from '@/models/User';
import { encryptBuffer, decryptBuffer } from '@/lib/encryption';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { assertAdmin, assertSession, escapeRegex, isValidObjectId, sanitizeString } from '@/lib/security';

// --- ADMIN: GET USERS ---
export async function getUsers(query = '') {
  try { await assertAdmin(); } catch { return []; }
  await connectDB();
  try {
    let searchFilter = {};
    if (query && typeof query === 'string') {
      const safe = escapeRegex(sanitizeString(query, 100));
      if (safe) {
        searchFilter = { $or: [
          { name: { $regex: safe, $options: 'i' } },
          { email: { $regex: safe, $options: 'i' } }
        ]};
      }
    }

    // Paginate — never return the entire user collection unbounded
    const usersData = await User.find(searchFilter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const processedUsers = usersData.map(user => {
      let displayImage = user.image;

      if (user.profilePicture?.data && user.profilePicture?.iv) {
        try {
          const encryptedData = Buffer.isBuffer(user.profilePicture.data)
            ? user.profilePicture.data
            : Buffer.from(user.profilePicture.data.buffer || user.profilePicture.data);
          const iv = Buffer.isBuffer(user.profilePicture.iv)
            ? user.profilePicture.iv
            : Buffer.from(user.profilePicture.iv.buffer || user.profilePicture.iv);
          const decryptedBuffer = decryptBuffer(encryptedData, iv);
          if (decryptedBuffer) {
            displayImage = `data:${user.profilePicture.contentType || 'image/jpeg'};base64,${decryptedBuffer.toString('base64')}`;
          }
        } catch (error) {
          console.error(`Error decrypting user ${user._id}:`, error.message);
        }
      }

      // Never return the password hash or sensitive OTP fields
      const { password, emailChangeOTP, emailChangeOTPExpires, pendingNewEmail, profilePicture, ...safeUser } = user;
      return { ...safeUser, _id: user._id.toString(), image: displayImage };
    });

    return JSON.parse(JSON.stringify(processedUsers));
  } catch (error) {
    console.error('Get Users Error:', error);
    return [];
  }
}

// --- ADMIN: BAN / UNBAN ---
export async function toggleUserBan(id, currentStatus) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  await User.findByIdAndUpdate(id, { isBanned: !currentStatus });
  revalidatePath('/admin/users');
  return { success: true };
}

// --- ADMIN: TOGGLE ROLE ---
export async function toggleUserRole(id, currentRole) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  await User.findByIdAndUpdate(id, { role: newRole });
  revalidatePath('/admin/users');
  return { success: true };
}

// --- ADMIN: DELETE USER ---
export async function deleteUser(id) {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  if (!isValidObjectId(id)) return { error: 'Invalid ID' };
  await connectDB();
  await User.findByIdAndDelete(id);
  revalidatePath('/admin/users');
  return { success: true };
}

// --- USER: UPDATE PROFILE (must use session — no email from formData) ---
export async function updateUserProfile(formData) {
  let session;
  try { session = await assertSession(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();
  try {
    const user = await User.findOne({ email: session.user.email });
    if (!user) return { error: 'User not found' };

    const name = sanitizeString(formData.get('name'), 100);
    const phone = sanitizeString(formData.get('phone'), 20);
    if (name) user.name = name;
    if (phone) user.phone = phone;

    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      // 5 MB max enforced inside encryptBuffer via storage guard
      if (imageFile.size > 5 * 1024 * 1024) return { error: 'Image too large (max 5 MB)' };
      const bytes = await imageFile.arrayBuffer();
      const { iv, content } = encryptBuffer(Buffer.from(bytes));
      user.profilePicture = { data: content, iv, contentType: imageFile.type };
      user.image = null;
    }
    await user.save();
    revalidatePath('/account');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) { return { error: 'Failed to update profile' }; }
}

// --- USER: CHANGE PASSWORD ---
export async function changePassword(formData) {
  let session;
  try { session = await assertSession(); } catch { return { success: false, error: 'Unauthorized' }; }

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (newPassword !== confirmPassword) return { success: false, error: 'Passwords do not match' };
  if (!newPassword || newPassword.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return { success: false, error: 'User not found' };

  if (user.password && user.password.length > 0) {
    if (!currentPassword) return { success: false, error: 'Current password required' };
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return { success: false, error: 'Incorrect current password' };
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return { success: true };
}

// --- USER: INITIATE EMAIL CHANGE ---
export async function initiateEmailChange(formData) {
  let session;
  try { session = await assertSession(); } catch { return { success: false, error: 'Unauthorized' }; }

  const password = formData.get('password');
  const newEmail = sanitizeString(formData.get('newEmail'), 200)?.toLowerCase();

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { success: false, error: 'Valid new email is required' };
  }
  if (newEmail === session.user.email) return { success: false, error: 'Please enter a different email' };

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return { success: false, error: 'User not found' };

  if (user.password && user.password.length > 0) {
    if (!password) return { success: false, error: 'Password required' };
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { success: false, error: 'Incorrect password' };
  }

  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) return { success: false, error: 'Email is already in use' };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailChangeOTP = otp;
  user.emailChangeOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.pendingNewEmail = newEmail;
  await user.save();

  try {
    await sendOtpEmail(newEmail, otp, 'email_change');
  } catch (error) {
    return { success: false, error: 'Failed to send OTP email' };
  }
  return { success: true };
}

// --- USER: VERIFY EMAIL CHANGE OTP ---
export async function verifyEmailChangeOTP(formData) {
  let session;
  try { session = await assertSession(); } catch { return { success: false, error: 'Unauthorized' }; }

  const otp = sanitizeString(formData.get('otp'), 10);
  const newEmail = sanitizeString(formData.get('newEmail'), 200)?.toLowerCase();

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user || user.pendingNewEmail !== newEmail) return { success: false, error: 'Invalid request' };
  if (user.emailChangeOTP !== otp) return { success: false, error: 'Invalid OTP' };
  if (user.emailChangeOTPExpires < new Date()) return { success: false, error: 'OTP expired' };

  user.email = newEmail;
  user.emailChangeOTP = undefined;
  user.emailChangeOTPExpires = undefined;
  user.pendingNewEmail = undefined;
  await user.save();
  return { success: true };
}
