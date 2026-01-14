'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

export default function AdminLayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Hide Sidebar ONLY if we are exactly on the login page
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full bg-[#050505] selection:bg-[#B91C1C] selection:text-white">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-manrope selection:bg-[#B91C1C] selection:text-white overflow-x-hidden">
      {/* Sidebar: Fixed on Desktop, Hidden/Drawer on Mobile */}
      <AdminSidebar />
      
      {/* Main Content Area 
          - lg:ml-[280px]: Pushes content right on desktop to accommodate fixed sidebar
          - pt-[70px]: Adds top padding on mobile for the mobile menu bar
          - lg:pt-0: Removes top padding on desktop
          - w-full: Ensures it takes full width
          - max-w-[100vw]: Prevents horizontal overflow
      */}
      <main className="flex-1 w-full lg:ml-[280px] pt-[80px] lg:pt-0 min-h-screen relative bg-white">
        {children}
      </main>
    </div>
  );
}