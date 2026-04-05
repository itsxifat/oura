import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  
  // Public URL
  image: { type: String }, 

  // SECURE: Encrypted Custom Profile Picture
  profilePicture: {
    data: Buffer,
    iv: Buffer,
    contentType: String
  },

  provider: { type: String, enum: ['credentials', 'google', 'guest'], default: 'credentials' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },

  // ── Device & network fingerprint history ─────────────────────────────────
  // Populated on account creation, every purchase, and site visits (24h dedup).
  registrationIp:       { type: String, default: null },
  registrationDeviceId: { type: String, default: null },
  knownIps: [{
    ip:        { type: String },
    firstSeen: { type: Date, default: Date.now },
    lastSeen:  { type: Date, default: Date.now },
  }],
  knownDevices: [{
    deviceId:  { type: String },
    userAgent: { type: String, default: '' },
    firstSeen: { type: Date, default: Date.now },
    lastSeen:  { type: Date, default: Date.now },
  }],

  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  emailChangeOTP: { type: String },
  emailChangeOTPExpires: { type: Date },
  pendingNewEmail: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

