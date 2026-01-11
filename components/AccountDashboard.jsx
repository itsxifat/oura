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
  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const Icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon = Icons[type] || Info;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }} 
      animate={{ opacity: 1, y: 0, x: '-50%' }} 
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-24 left-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border ${bgColors[type] || bgColors.info} backdrop-blur-md w-[90%] max-w-[350px]`}
    >
      <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
        <Icon size={16} className={type === 'error' ? 'text-red-600' : 'text-green-600'} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{type}</p>
        <p className="text-xs font-medium leading-tight">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity"><X size={16}/></button>
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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.to(".anim-header", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
        gsap.to(".anim-card", { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)", stagger: 0.1, delay: 0.2 });
        gsap.to(".anim-footer", { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.4 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [status]);

  if (status === "loading") return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"/></div>;
  if (!session) return null;

  return (
    <div ref={containerRef} className="max-w-[1400px] mx-auto px-4 md:px-8 pb-20 font-manrope">
      
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="anim-header opacity-0 translate-y-8 flex flex-col md:flex-row items-center md:items-end justify-between mb-10 md:mb-16 gap-6 pt-6 md:pt-10 border-b border-gray-100 pb-8">
        <div className="text-center md:text-left order-2 md:order-1">
          <span className="font-tenor text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2 block">My Dashboard</span>
          <h1 className="font-bodoni text-3xl md:text-5xl lg:text-6xl text-gray-900 leading-tight">
            Hello, {session.user?.name?.split(' ')[0]}
          </h1>
          <p className="md:hidden text-xs text-gray-400 mt-2 font-medium">{session.user?.email}</p>
        </div>

        <div className="order-1 md:order-2 relative group cursor-pointer" onClick={() => setIsEditOpen(true)}>
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 scale-110 animate-pulse"></div>
            <div className="relative overflow-hidden rounded-full w-20 h-20 md:w-24 md:h-24 border-2 border-white shadow-lg">
                {session.user?.image && !imageError ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#D4AF37] text-white flex items-center justify-center text-3xl font-bodoni">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white drop-shadow-md" />
                </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 text-gray-900">
               <Settings size={12} strokeWidth={2} />
            </div>
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        {/* Profile Card */}
        <div className="anim-card opacity-0 translate-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg md:mb-6 shrink-0">
               <User size={18} strokeWidth={1.5} />
             </div>
             <div className="flex-1">
                <h3 className="font-tenor text-xs uppercase tracking-widest text-gray-500 mb-1">Account</h3>
                <p className="font-bodoni text-lg md:text-xl text-gray-900 leading-none">{session.user?.name}</p>
                <p className="text-xs text-gray-400 mt-1 truncate max-w-[150px] md:max-w-none hidden md:block">{session.user?.email}</p>
             </div>
             <button onClick={() => setIsEditOpen(true)} className="md:hidden px-4 py-2 bg-gray-50 text-[10px] font-bold uppercase tracking-wider rounded-lg">Edit</button>
          </div>
          <div onClick={() => setIsEditOpen(true)} className="hidden md:flex mt-6 border-t border-gray-50 pt-4 items-center justify-between cursor-pointer group-hover:opacity-70 transition-opacity">
             <span className="text-[10px] font-bold uppercase tracking-widest">Edit Details</span>
             <ArrowRight size={14} />
          </div>
        </div>

        {/* Orders Card */}
        <div className="anim-card opacity-0 translate-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 text-black rounded-full flex items-center justify-center md:mb-6 shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-500">
               <Package size={18} strokeWidth={1.5} />
             </div>
             <div className="flex-1">
                <h3 className="font-tenor text-xs uppercase tracking-widest text-gray-500 mb-1">Orders</h3>
                <p className="font-bodoni text-lg md:text-xl text-gray-900 leading-none">My History</p>
                <p className="text-xs text-gray-400 mt-1 hidden md:block">Track & Return items</p>
             </div>
             <ArrowRight size={16} className="md:hidden text-gray-300" />
           </div>
           <div className="hidden md:flex mt-6 border-t border-gray-50 pt-4 items-center justify-between cursor-pointer">
             <span className="text-[10px] font-bold uppercase tracking-widest">View All</span>
             <ArrowRight size={14} />
           </div>
        </div>

        {/* Wishlist Card */}
        <div className="anim-card opacity-0 translate-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 text-black rounded-full flex items-center justify-center md:mb-6 shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors duration-500">
               <Heart size={18} strokeWidth={1.5} />
             </div>
             <div className="flex-1">
                <h3 className="font-tenor text-xs uppercase tracking-widest text-gray-500 mb-1">Wishlist</h3>
                <p className="font-bodoni text-lg md:text-xl text-gray-900 leading-none">Favorites</p>
                <p className="text-xs text-gray-400 mt-1 hidden md:block">Saved for later</p>
             </div>
             <ArrowRight size={16} className="md:hidden text-gray-300" />
           </div>
           <div className="hidden md:flex mt-6 border-t border-gray-50 pt-4 items-center justify-between cursor-pointer">
             <span className="text-[10px] font-bold uppercase tracking-widest">View Saved</span>
             <ArrowRight size={14} />
           </div>
        </div>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="anim-footer opacity-0 translate-y-8 space-y-3">
          <div className="md:hidden bg-white rounded-xl border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-50 flex items-center justify-between active:bg-gray-50">
                <div className="flex items-center gap-3">
                   <Settings size={18} className="text-gray-400"/>
                   <span className="text-sm font-medium">Settings</span>
                </div>
                <ArrowRight size={14} className="text-gray-300"/>
             </div>
             <div className="p-4 flex items-center justify-between active:bg-gray-50">
                <div className="flex items-center gap-3">
                   <CreditCard size={18} className="text-gray-400"/>
                   <span className="text-sm font-medium">Payment Methods</span>
                </div>
                <ArrowRight size={14} className="text-gray-300"/>
             </div>
          </div>

          <button 
             onClick={() => signOut({ callbackUrl: '/' })} 
             className="w-full md:w-auto mx-auto md:mx-0 flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-xl md:rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-sm"
          >
             <LogOut size={16} />
             <span>Sign Out</span>
          </button>
      </div>

      {/* RENDER UNIFIED MODAL */}
      <EditProfileModal 
        user={session.user} 
        userHasPassword={userHasPassword} // Pass the flag
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </div>
  );
}