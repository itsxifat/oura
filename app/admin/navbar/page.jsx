import { getCategories } from '@/app/actions';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import NavbarClient from './NavbarClient';

export default async function NavbarPage() {
  await connectDB();
  const categoriesTree = await getCategories();
  
  // Get current config
  const config = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const currentLinks = config?.navbarLinks || [];

  // Serialize IDs
  const safeLinks = JSON.parse(JSON.stringify(currentLinks));

  return <NavbarClient categories={categoriesTree} currentLinks={safeLinks} />;
}