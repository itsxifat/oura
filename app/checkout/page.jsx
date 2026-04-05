import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import User from '@/models/User';
import Navbar from '@/components/Navbar';
import CheckoutClient from '@/components/CheckoutClient';
import { getSavedAddresses } from '@/app/actions';
import { getShopSettings } from '@/actions/settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

  // 2. Fetch session user info for auto-fill
  let sessionUser = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const dbUser = await User.findById(session.user.id).select('name email phone').lean();
      if (dbUser) {
        const nameParts = (dbUser.name || '').trim().split(' ');
        sessionUser = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: dbUser.email || '',
          phone: dbUser.phone || '',
        };
      }
    }
  } catch { /* not logged in — guest checkout */ }

  // 3. Fetch Saved Addresses (only for logged-in users)
  const savedAddresses = await getSavedAddresses();

  // 4. Fetch shop settings
  const shopSettings = await getShopSettings();

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      <CheckoutClient
        savedAddresses={savedAddresses}
        sessionUser={sessionUser}
        shopSettings={shopSettings}
      />
    </div>
  );
}
