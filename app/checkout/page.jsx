import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import Navbar from '@/components/Navbar';
import CheckoutClient from '@/components/CheckoutClient';
import { getSavedAddresses } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  await connectDB();

  // 1. Fetch Navbar
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 2. Fetch Saved Addresses (Securely on server)
  const savedAddresses = await getSavedAddresses();

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      <CheckoutClient savedAddresses={savedAddresses} />
    </div>
  );
}