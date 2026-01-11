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
  // We must sanitize the Mongoose object to plain JSON before passing to Client Components.
  // This prevents the "Heap out of memory" error.
  const rawLinks = siteContent?.navbarLinks ? siteContent.navbarLinks : [];
  const sanitizedLinks = JSON.parse(JSON.stringify(rawLinks));

  const navData = {
    logoImage: "/logo.png",
    logoText: "ANAQA",
    links: sanitizedLinks
  };

  // 2. Fetch All Products (Ensure this action also returns plain JSON)
  const products = await getAllProducts();

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      {/* Navbar with Sticky Logic enabled via props if needed, 
          but usually we handle path detection inside Navbar */}
      <Navbar navData={navData} />
      
      {/* Product Listing with Sticky Filter Bar */}
      <ProductListing initialProducts={products} />
    </div>
  );
}