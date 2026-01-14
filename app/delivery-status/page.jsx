import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import Navbar from '@/components/Navbar'; 
import DeliveryClient from '@/components/DeliveryClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
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
      
      {/* Client Component for Interactive Status */}
      <main>
        <DeliveryClient />
      </main>
    </div>
  );
}