'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User, Package, Heart, LogOut, Settings, Camera, CheckCircle, AlertCircle, Info, X, ArrowRight, Lock, Mail, CreditCard } from "lucide-react";
import gsap from "gsap";
import EditProfileModal from "@/components/EditProfileModal"; 
import { AnimatePresence, motion } from "framer-motion";

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-[#B91C1C]/20 text-[#B91C1C]',
    info: 'bg-white border-gray-200 text-black',
  };
  const Icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon = Icons[type] || Info;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }} 
      animate={{ opacity: 1, y: 0, x: '-50%' }} 
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-10 left-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border ${styles[type] || styles.info} backdrop-blur-xl w-auto min-w-[300px]`}
    >
      <Icon size={18} className={type === 'error' ? 'text-[#B91C1C]' : type === 'success' ? 'text-green-600' : 'text-black'} />
      <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-auto opacity-40 hover:opacity-100"><X size={16}/></button>
    </motion.div>
  );
};

export default function AccountDashboard({ userHasPassword }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const containerRef = useRef(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.to(".anim-header", { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
        gsap.to(".anim-card", { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.2 });
        gsap.to(".anim-footer", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.4 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [status]);

  if (status === "loading") return (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#B91C1C] border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  
  if (!session) return null;

  return (
    <div ref={containerRef} className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24 font-manrope bg-white min-h-screen">
      
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="anim-header opacity-0 translate-y-10 flex flex-col md:flex-row items-center md:items-end justify-between pt-12 md:pt-20 mb-16 md:mb-24 gap-8">
        
        {/* Text Info */}
        <div className="text-center md:text-left order-2 md:order-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
             <div className="h-[1px] w-8 bg-[#B91C1C]"></div>
             <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B91C1C]">My Account</span>
          </div>
          <h1 className="font-bodoni text-4xl md:text-6xl text-black leading-tight mb-2">
            Welcome back,<br/> <span className="italic text-gray-400">{session.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mt-2">{session.user?.email}</p>
        </div>

        {/* Profile Image */}
        <div className="order-1 md:order-2 relative group cursor-pointer" onClick={() => setIsEditOpen(true)}>
            {/* Animated Ring */}
            <div className="absolute inset-0 rounded-full border border-[#B91C1C]/20 scale-125 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative overflow-hidden rounded-full w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-2xl group-hover:shadow-[#B91C1C]/20 transition-shadow duration-500">
                {session.user?.image && !imageError ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#B91C1C] text-white flex items-center justify-center text-4xl font-bodoni">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Edit Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white border-b border-white pb-1">Edit</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- DASHBOARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        
        {/* 1. Profile Details */}
        <div className="anim-card opacity-0 translate-y-12 bg-gray-50/50 p-8 rounded-2xl border border-gray-100 hover:border-[#B91C1C]/30 hover:bg-white hover:shadow-xl hover:shadow-[#B91C1C]/5 transition-all duration-500 group relative">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-black group-hover:text-[#B91C1C] transition-colors">
              <User size={20} strokeWidth={1.5} />
           </div>
           <h3 className="font-bodoni text-2xl text-black mb-1">Details</h3>
           <p className="text-xs text-gray-500 mb-8 leading-relaxed">Manage your personal information and password.</p>
           <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black group-hover:text-[#B91C1C] transition-colors">
              Edit Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
           </button>
        </div>

        {/* 2. Orders */}
        <div className="anim-card opacity-0 translate-y-12 bg-gray-50/50 p-8 rounded-2xl border border-gray-100 hover:border-[#B91C1C]/30 hover:bg-white hover:shadow-xl hover:shadow-[#B91C1C]/5 transition-all duration-500 group relative">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-black group-hover:text-[#B91C1C] transition-colors">
              <Package size={20} strokeWidth={1.5} />
           </div>
           <h3 className="font-bodoni text-2xl text-black mb-1">Orders</h3>
           <p className="text-xs text-gray-500 mb-8 leading-relaxed">Track shipments and view your purchase history.</p>
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black group-hover:text-[#B91C1C] transition-colors">
              View History <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
           </button>
        </div>

        {/* 3. Wishlist */}
        <div className="anim-card opacity-0 translate-y-12 bg-gray-50/50 p-8 rounded-2xl border border-gray-100 hover:border-[#B91C1C]/30 hover:bg-white hover:shadow-xl hover:shadow-[#B91C1C]/5 transition-all duration-500 group relative">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-black group-hover:text-[#B91C1C] transition-colors">
              <Heart size={20} strokeWidth={1.5} />
           </div>
           <h3 className="font-bodoni text-2xl text-black mb-1">Wishlist</h3>
           <p className="text-xs text-gray-500 mb-8 leading-relaxed">View and manage items you have saved for later.</p>
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black group-hover:text-[#B91C1C] transition-colors">
              View Wishlist <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
           </button>
        </div>

      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="anim-footer opacity-0 translate-y-10 border-t border-gray-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-6">
             <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Payment Methods</button>
             <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Contact Support</button>
          </div>

          <button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="group flex items-center gap-3 px-6 py-3 rounded-full border border-gray-200 hover:border-[#B91C1C] hover:bg-[#B91C1C] transition-all duration-300"
          >
              <LogOut size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">Sign Out</span>
          </button>
      </div>

      {/* MODAL */}
      <EditProfileModal 
        user={session.user} 
        userHasPassword={userHasPassword} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </div>
  );
}