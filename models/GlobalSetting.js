import mongoose from 'mongoose';

const GlobalSettingSchema = new mongoose.Schema({
  identifier: { type: String, required: true, unique: true }, // e.g., 'master_sizes'
  value: { type: mongoose.Schema.Types.Mixed, default: {} }   // Flexible storage
}, { timestamps: true });

export default mongoose.models.GlobalSetting || mongoose.model('GlobalSetting', GlobalSettingSchema);