import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, default: 'Home' }, // Home, Office, etc.
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Address || mongoose.model('Address', AddressSchema);