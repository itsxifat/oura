import mongoose from "mongoose";

const steadfastAccountSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cookies: { type: String, default: null }, // Stored as "key=value; key2=val2" string
  isValid: { type: Boolean, default: false }, // True if last login was successful
  lastLogin: { type: Date, default: null },
  lastUsed: { type: Date, default: null },
  errorMsg: { type: String, default: null }, // To show in admin panel why it failed
}, { timestamps: true });

export default mongoose.models.SteadfastAccount || mongoose.model("SteadfastAccount", steadfastAccountSchema);