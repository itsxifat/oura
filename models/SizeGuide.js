import mongoose from 'mongoose';

const SizeGuideSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  columns: [{ type: String, required: true }],
  rows: [{
    values: [{ 
      type: String, 
      // Explicitly setting required to false isn't strictly necessary 
      // but 'default: ""' is safer to ensure no nulls are saved.
      default: "" 
    }] 
  }]
}, { timestamps: true });

// --- CRITICAL FIX BELOW ---
// This checks if the model exists in the cache. 
// If it does, we DELETE it so Mongoose is forced to rebuild it with your new Schema.
if (mongoose.models && mongoose.models.SizeGuide) {
  delete mongoose.models.SizeGuide;
}

const SizeGuide = mongoose.model('SizeGuide', SizeGuideSchema);

export default SizeGuide;