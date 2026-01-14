import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { getAllProducts } from '@/app/actions';
import Navbar from '@/components/Navbar';
import ProductListing from '@/components/ProductListing';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await connectDB();

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  
  // --- CRITICAL MEMORY FIX ---
  const rawLinks = siteContent?.navbarLinks ? siteContent.navbarLinks : [];
  const sanitizedLinks = JSON.parse(JSON.stringify(rawLinks));

  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: sanitizedLinks
  };

  // 2. Fetch All Products
  const products = await getAllProducts();

  return (
    // ✅ FIX: Changed background to White for premium contrast
    <div className="bg-white min-h-screen text-black selection:bg-[#B91C1C] selection:text-white">
      <Navbar navData={navData} />
      
      {/* Product Listing handles its own internal layout/padding */}
      <ProductListing initialProducts={products} />
    </div>
  );
}