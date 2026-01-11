// anaqa/models/Hero.js
import mongoose from 'mongoose';

const HeroSchema = new mongoose.Schema({
  link: { type: String, default: '/' },
  
  // CHANGED: String paths instead of Buffer
  image: { type: String }, // Desktop Path
  mobileImage: { type: String }, // Mobile Path
}, { timestamps: true });

export default mongoose.models.Hero || mongoose.model('Hero', HeroSchema);