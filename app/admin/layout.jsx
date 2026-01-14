import AdminLoginPage from './login/page'; 
import AdminLayoutWrapper from './components/AdminLayoutWrapper'; // Handles Sidebar & Mobile Layout
import { verifyAdminToken, authOptions } from '@/lib/auth';
import { getServerSession } from "next-auth";
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  // 1. Check Legacy Master Key
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  let isLegacyAdmin = false;
  
  if (token) {
    const verified = await verifyAdminToken(token);
    if (verified) isLegacyAdmin = true;
  }

  // 2. Check User Account (NextAuth) - DEEP VERIFICATION
  let isAccountAdmin = false;
  const session = await getServerSession(authOptions);
  
  if (session?.user?.email) {
    if (session.user.role === 'admin') {
      isAccountAdmin = true;
    } else {
      // Fallback: Check DB if session is stale
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email }).select('role');
      if (dbUser && dbUser.role === 'admin') {
        isAccountAdmin = true;
      }
    }
  }

  // 3. Authenticate
  const isAuthenticated = isLegacyAdmin || isAccountAdmin;

  // 4. Render Login if failed (Render-in-Place)
  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  // 5. Render Admin Layout (Session is now provided by RootLayout)
  return (
    <AdminLayoutWrapper>
      {children}
    </AdminLayoutWrapper>
  );
}