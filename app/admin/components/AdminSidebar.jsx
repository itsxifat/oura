'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Images, Settings, Monitor, Menu, X, 
  Layers, Users, ShoppingBag, Package, Ticket, Tag, 
  LogOut as SignOutIcon
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContent = ({ activePath, onClickItem }) => {
  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag }, 
    { href: '/admin/tags', label: 'Product Tags', icon: Tag }, 
    { href: '/admin/sizes', label: 'Size', icon: Settings },
    { href: '/admin/settings/cookies', label: 'Cookies', icon: Settings },
    { href: '/admin/categories', label: 'Categories', icon: Layers },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/carousel', label: 'Carousel Studio', icon: Images },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/navbar', label: 'Navigation', icon: Monitor },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // CSS Filter for White Logo in Sidebar
  const whiteFilter = "brightness(0) invert(1)"; 

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white border-r border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-[#B91C1C]/10 blur-[80px] pointer-events-none" />

      {/* Brand Header */}
      <div className="p-8 pb-10 flex justify-between items-center relative z-10">
        <div>
          <div className="relative w-24 h-10 mb-3 opacity-90">
             <Image 
               src="/logo.png" 
               alt="OURA" 
               fill 
               className="object-contain" 
               style={{ filter: whiteFilter }} 
               priority 
             />
          </div>
          <div className="flex items-center gap-2">
              <div className="h-[1px] w-6 bg-[#B91C1C]"></div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#B91C1C] font-bold">Admin Suite</p>
          </div>
        </div>
        {onClickItem && (
          <button onClick={onClickItem} className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar relative z-10 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href || (item.href !== '/admin/dashboard' && activePath.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClickItem}
              className={`relative flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-[#B91C1C]/20 to-transparent text-white border border-[#B91C1C]/30 shadow-lg shadow-[#B91C1C]/10' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                 <motion.div 
                   layoutId="active-indicator"
                   className="absolute left-0 top-3 bottom-3 w-1 bg-[#B91C1C] rounded-r-full" 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 />
              )}

              <Icon size={18} className={`relative z-10 transition-colors duration-300 ${isActive ? "text-[#B91C1C]" : "group-hover:text-white"}`} strokeWidth={1.5} />
              <span className={`font-manrope text-xs font-bold tracking-widest uppercase flex-1 relative z-10 ${isActive ? "text-white" : ""}`}>{item.label}</span>
              
              {/* Subtle Red Glow on Active */}
              {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#B91C1C] shadow-[0_0_10px_#B91C1C]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-white/5 bg-[#0a0a0a] relative z-10">
        <button 
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center justify-center gap-3 text-gray-500 hover:text-red-400 transition-all duration-300 w-full px-4 py-3.5 hover:bg-red-500/10 rounded-xl group border border-transparent hover:border-red-500/20"
        >
          <SignOutIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Filter for mobile header logo (Maroon)
  const maroonFilter = "brightness(0) saturate(100%) invert(8%) sepia(94%) saturate(7466%) hue-rotate(358deg) brightness(88%) contrast(112%)";

  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Mobile Top Bar (Premium White/Red) */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-[60] px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div className="relative w-20 h-8">
           <Image 
             src="/logo.png" 
             alt="OURA" 
             fill 
             className="object-contain" 
             style={{ filter: maroonFilter }} 
             priority 
           />
        </div>
        <button onClick={() => setIsOpen(true)} className="text-black p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-[70] lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed" animate="open" exit="closed"
              className="fixed top-0 left-0 z-[80] h-screen w-[280px] lg:hidden shadow-2xl border-r border-white/10"
            >
              <SidebarContent activePath={pathname} onClickItem={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-[280px]">
        <SidebarContent activePath={pathname} />
      </aside>
    </>
  );
}