'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Images, 
  Settings, 
  Monitor, 
  LogOut, 
  Menu, 
  X, 
  Layers, 
  Users, 
  ShoppingBag,
  Package, // For Orders
  Ticket,  // For Coupons
  Tag,     // For Tags
  LogOut as SignOutIcon
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContent = ({ activePath, onClickItem }) => {
  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag }, 
    { href: '/admin/tags', label: 'Product Tags', icon: Tag }, // New Tags Route
    { href: '/admin/sizes', label: 'Size', icon: Settings },
    { href: '/admin/settings/cookies', label: 'Cookies', icon: Settings },
    { href: '/admin/categories', label: 'Categories', icon: Layers },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/carousel', label: 'Carousel Studio', icon: Images },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/navbar', label: 'Navigation', icon: Monitor },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white border-r border-white/5 shadow-2xl">
      {/* Brand Header */}
      <div className="p-8 pb-10 flex justify-between items-center relative">
        <div>
          <h1 className="font-bodoni text-3xl font-bold tracking-widest text-white">ANAQA</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-[1px] w-8 bg-[#D4AF37]"></div>
             <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">Admin Suite</p>
          </div>
        </div>
        {onClickItem && (
          <button onClick={onClickItem} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto scrollbar-none hover:scrollbar-thin scrollbar-thumb-gray-800">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Check if active (exact match for dashboard, startsWith for others)
          const isActive = activePath === item.href || (item.href !== '/admin/dashboard' && activePath.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClickItem}
              className={`relative flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden
                ${isActive 
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                 <motion.div 
                   layoutId="active-indicator"
                   className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 />
              )}

              <Icon size={18} className={`relative z-10 transition-colors duration-300 ${isActive ? "text-[#D4AF37]" : "group-hover:text-white"}`} />
              <span className="font-manrope text-xs font-bold tracking-widest uppercase flex-1 relative z-10">{item.label}</span>
              
              {/* Subtle Gold Glow on Active */}
              {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <button className="flex items-center justify-center gap-3 text-gray-500 hover:text-red-400 transition-all duration-300 w-full px-4 py-3 hover:bg-red-500/10 rounded-xl group border border-transparent hover:border-red-500/20">
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

  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#050505]/90 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <span className="font-bodoni text-xl font-bold text-white tracking-widest">ANAQA</span>
        <button onClick={() => setIsOpen(true)} className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
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
              className="fixed inset-0 bg-black/90 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed" animate="open" exit="closed"
              className="fixed top-0 left-0 z-50 h-screen w-[280px] lg:hidden shadow-2xl"
            >
              <SidebarContent activePath={pathname} onClickItem={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-[280px]">
        <SidebarContent activePath={pathname} />
      </aside>
    </>
  );
}