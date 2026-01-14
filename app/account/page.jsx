import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import User from '@/models/User'; 
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
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 2. Check Password Status
  let userHasPassword = false;
  if (session?.user?.email) {
    const userDoc = await User.findOne({ email: session.user.email }).select('password').lean();
    userHasPassword = !!userDoc?.password; 
  }

  return (
    // ✅ FIX: White background & reduced padding to fix "too much margin"
    <div className="bg-white min-h-screen">
      <Navbar navData={navData} />
      
      {/* Reduced top padding just enough to clear the fixed Navbar */}
      <main className=""> 
        <AccountDashboard userHasPassword={userHasPassword} />
      </main>
    </div>
  );
}