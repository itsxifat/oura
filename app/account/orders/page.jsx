import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import Navbar from '@/components/Navbar'; 
import OrdersClient from '@/components/OrdersClient';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  await connectDB();

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  
  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar navData={navData} />
      
      {/* Content rendered immediately after sticky navbar (No Margin Top) */}
      <main>
        <OrdersClient />
      </main>
    </div>
  );
}