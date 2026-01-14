"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, Search, User, LogOut, ArrowRight, X, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useCart } from '@/lib/context/CartContext'; 
import { usePathname } from 'next/navigation';

// --- ANIMATION VARIANTS (Snappier & More Professional) ---
const menuVariants = {
  hidden: { opacity: 0, x: '-100%' },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "tween", ease: "circOut", duration: 0.4 } 
  },
  exit: { 
    opacity: 0, 
    x: '-100%',
    transition: { type: "tween", ease: "circIn", duration: 0.3 } 
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: 'auto',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    height: 0,
    transition: { duration: 0.2 } 
  }
};

// --- MOBILE MENU DRAWER ---
const MobileMenu = ({ isOpen, onClose, navData, session }) => {
  const [activeSub, setActiveSub] = useState(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] lg:hidden"
          />
          <motion.div 
            variants={menuVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed top-0 left-0 h-full w-[80%] max-w-[300px] bg-white z-[160] shadow-2xl overflow-y-auto lg:hidden font-sans flex flex-col border-r border-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-white">
              <div className="w-20">
                {/* Removed 'opacity-90' to make the image clear */}
                <img src="/logo.png" alt="OURA" className="w-full object-contain" />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 text-gray-800 transition rounded-full">
                <X size={20} strokeWidth={1} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {navData?.links?.map((link) => (
                <div key={link.label} className="border-b border-gray-50 pb-2 last:border-0">
                  <div className="flex justify-between items-center py-2 group cursor-pointer" onClick={() => setActiveSub(activeSub === link.label ? null : link.label)}>
                      <Link href={link.href || '#'} onClick={(e) => { if(!link.children?.length) onClose(); }} className="font-sans text-sm font-semibold uppercase tracking-wider text-gray-800 group-hover:text-[#B91C1C] transition">
                        {link.label}
                      </Link>
                      {link.children?.length > 0 && (
                        <ChevronDown size={16} strokeWidth={1.5} className={`text-gray-400 transition-transform duration-300 ${activeSub === link.label ? 'rotate-180 text-[#B91C1C]' : ''}`} />
                      )}
                  </div>
                  <AnimatePresence>
                    {activeSub === link.label && link.children && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pl-4 border-l border-[#B91C1C]/20 mt-1 space-y-1 py-2">
                          {link.children.map(child => (
                            <div key={child.label} className="mb-3 last:mb-0">
                               <p className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{child.label}</p>
                               <div className="pl-2 space-y-2 flex flex-col">
                                 {child.children?.map(grandchild => (
                                   <Link key={grandchild.label} href={grandchild.href || '#'} onClick={onClose} className="text-xs font-medium text-gray-600 hover:text-[#B91C1C] transition-colors">
                                     {grandchild.label}
                                   </Link>
                                 ))}
                               </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 bg-[#B91C1C] text-white flex items-center justify-center font-sans font-bold text-xs shadow-sm rounded-full">
                        {session.user?.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-semibold text-gray-900 text-xs truncate uppercase">{session.user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/account" onClick={onClose} className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all"><User size={12} /> Account</Link>
                    <Link href="/orders" onClick={onClose} className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all"><ShoppingBag size={12} /> Orders</Link>
                  </div>
                  <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 py-2 border border-red-100 transition-colors"><LogOut size={12} /> Sign Out</button>
                </div>
              ) : (
                <Link href="/login" onClick={onClose} className="block w-full py-3 bg-black text-white text-center text-[10px] font-bold uppercase tracking-widest hover:bg-[#B91C1C] transition-colors">Sign In / Register</Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- MAIN NAVBAR ---
const Navbar = ({ navData }) => {
  const pathname = usePathname(); 
  const { data: session } = useSession();
  
  const cartContext = useCart();
  const cartCount = cartContext?.cartCount || 0;
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false); 
  const leaveTimeout = useRef(null);
  const profileRef = useRef(null); 
  const [mounted, setMounted] = useState(false);

  const isProductPage = pathname === '/products';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = (link) => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
    setActiveCategory(link);
  };

  const handleMouseLeave = () => {
    leaveTimeout.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  };

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <>
      <motion.nav 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`z-[100] bg-white text-black transition-all duration-300 border-b border-gray-100/50 ${
          isProductPage 
            ? 'relative' 
            : 'sticky top-0'
        } ${isScrolled ? 'shadow-sm bg-white/95 backdrop-blur-sm' : ''}`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-8">
          
          {/* TOP ROW - Compact Height (h-14 / 56px) */}
          <div className={`flex justify-between items-center h-14 relative z-[101] transition-all duration-300`}>
            
            {/* Left: Mobile Menu & Search */}
            <div className="flex items-center gap-4 flex-1">
              <button className="lg:hidden p-1 -ml-1 hover:bg-gray-50 rounded-md transition text-gray-800" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={20} strokeWidth={1} />
              </button>
              <div className="hidden lg:flex items-center gap-2 cursor-pointer text-gray-500 hover:text-black transition-colors group">
                <Search size={16} strokeWidth={1.5} />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] group-hover:underline decoration-[#B91C1C] underline-offset-4">Search</span>
              </div>
            </div>

            {/* Center: LOGO (Scaled Down for elegance) */}
            <div className="flex-1 text-center flex justify-center">
              <Link href="/" className="inline-block group relative">
                <img 
                  src="/logo.png" 
                  alt="OURA" 
                  className="h-7 md:h-8 w-auto object-contain transition-opacity duration-300 hover:opacity-80" 
                />
              </Link>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center justify-end gap-5 flex-1">
              <div className="hidden lg:block relative" ref={profileRef}>
                {session ? (
                    <div className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-full hover:bg-gray-50 transition group" onClick={() => setProfileOpen(!profileOpen)}>
                      {session.user?.image ? (
                        <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-6 h-6 bg-[#B91C1C] text-white flex items-center justify-center font-sans font-bold text-[10px] rounded-full">
                            {session.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-sans text-[11px] font-semibold text-gray-700 hidden xl:block group-hover:text-black transition-colors uppercase tracking-wide">{session.user?.name?.split(' ')[0]}</span>
                    </div>
                ) : (
                    <Link href="/login" className="flex items-center opacity-60 hover:opacity-100 hover:text-[#B91C1C] transition gap-2">
                      <User size={18} strokeWidth={1.5} />
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] hidden xl:block">Sign In</span>
                    </Link>
                )}
                
                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileOpen && session && (
                    <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full right-0 mt-2 w-56 bg-white shadow-xl border border-gray-100 z-[150]">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="font-sans font-bold text-gray-900 text-xs uppercase tracking-wide">{session.user?.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{session.user?.email}</p>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link href="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-[#B91C1C] transition-colors"><User size={12} strokeWidth={1.5} /> Account</Link>
                        <Link href="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-[#B91C1C] transition-colors"><ShoppingBag size={12} strokeWidth={1.5} /> Orders</Link>
                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors text-left"><LogOut size={12} strokeWidth={1.5} /> Sign Out</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/cart" className="relative transition group">
                <ShoppingBag size={20} strokeWidth={1.5} className="text-gray-900 group-hover:text-[#B91C1C] transition-colors" />
                {mounted && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-[#B91C1C] text-white text-[8px] font-bold flex items-center justify-center rounded-full px-0.5 shadow-sm">
                      {cartCount > 99 ? '99' : cartCount}
                    </span>
                )}
              </Link>
            </div>
          </div>

          {/* --- BOTTOM ROW (Links) - Compact & Elegant --- */}
          <div className="hidden lg:flex justify-center border-t border-gray-100/50">
            <div className="flex gap-10">
              {navData?.links?.map((link, i) => {
                const isActive = activeCategory?._id === link._id;
                const hasChildren = link.children && link.children.length > 0;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + (i * 0.05) }} 
                    key={link._id || link.label} 
                    className="relative group/link py-3 cursor-pointer" 
                    onMouseEnter={() => hasChildren && handleMouseEnter(link)}
                  >
                    <Link href={link.href || '#'} className={`font-sans text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
                      {link.label}
                    </Link>
                    {/* Hover Line Animation */}
                    <span className={`absolute bottom-2.5 left-0 h-[1.5px] bg-[#B91C1C] transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover/link:w-full'}`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- MEGA MENU DROPDOWN (Clean & Professional) --- */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div 
              variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
              className="absolute top-full left-0 w-full bg-white border-t border-gray-100/80 shadow-lg overflow-hidden z-50" 
              onMouseEnter={() => handleMouseEnter(activeCategory)} 
              onMouseLeave={handleMouseLeave}
            >
              <div className="max-w-[1920px] mx-auto px-12 py-10">
                <div className="grid grid-cols-12 gap-12">
                  {/* Category Highlight */}
                  <div className="col-span-3 border-r border-gray-100 pr-8 flex flex-col justify-center">
                    <h2 className="font-sans text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4">{activeCategory.label}</h2>
                    <Link href={activeCategory.href || '#'} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] hover:text-black transition-colors group">
                        View All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                  </div>
                  
                  {/* Links Grid */}
                  <div className="col-span-9 grid grid-cols-4 gap-x-10 gap-y-8">
                    {activeCategory.children?.map((child) => (
                      <div key={child._id || child.label} className="group/child">
                        <Link href={child.href || '#'} className="block font-sans text-sm font-bold uppercase text-gray-900 mb-3 hover:text-[#B91C1C] transition-colors">
                          {child.label}
                        </Link>
                        <div className="flex flex-col gap-2">
                          {child.children?.map((grandchild) => (
                            <Link key={grandchild._id || grandchild.label} href={grandchild.href || '#'} className="font-sans text-[11px] font-medium text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-200 block">
                               {grandchild.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} navData={navData} session={session} />
    </>
  );
};

export default Navbar;