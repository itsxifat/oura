import mongoose from 'mongoose';

// Grandchild Item
const GrandchildLinkSchema = new mongoose.Schema({
  label: String,
  href: String,
});

// Child Category
const ChildLinkSchema = new mongoose.Schema({
  label: String,
  href: String,
  children: [GrandchildLinkSchema] // Nested Grandchildren
});

// Main Category
const NavLinkSchema = new mongoose.Schema({
  label: String,
  href: String,
  children: [ChildLinkSchema], // Nested Children
  order: Number
});

const SiteContentSchema = new mongoose.Schema({
  identifier: { type: String, unique: true, default: 'main_layout' },
  logoText: String,
  navbarLinks: [NavLinkSchema],
  // ... other fields
}, { timestamps: true });

export default mongoose.models.SiteContent || mongoose.model('SiteContent', SiteContentSchema);