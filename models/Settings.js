import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., "steadfast_creds"
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores { email, password, cookies }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model("Settings", settingsSchema);