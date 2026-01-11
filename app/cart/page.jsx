import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import Navbar from '@/components/Navbar';
import CartClient from '@/components/CartClient'; // We will create this next

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  await connectDB();

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "ANAQA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      <CartClient />
    </div>
  );
}