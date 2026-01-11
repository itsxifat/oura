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

  provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

