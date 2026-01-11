import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import User from '@/models/User'; // Import User model
import Navbar from '@/components/Navbar'; 
import AccountDashboard from '@/components/AccountDashboard'; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  await connectDB();
  const session = await getServerSession(authOptions);

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  
  const navData = {
    logoImage: "/logo.png",
    logoText: "ANAQA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 2. Check if user has a password set (Crucial for Google Users)
  let userHasPassword = false;
  if (session?.user?.email) {
    const userDoc = await User.findOne({ email: session.user.email }).select('password').lean();
    userHasPassword = !!userDoc?.password; // True if password exists, False if Google only
  }

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      <main className="pt-24 md:pt-32">
        {/* Pass the flag to the dashboard */}
        <AccountDashboard userHasPassword={userHasPassword} />
      </main>
    </div>
  );
}