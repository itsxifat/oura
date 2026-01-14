'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { loginAction } from '@/app/actions'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowRight, ShieldCheck, KeyRound, AlertCircle, LogOut, Mail, Lock, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

const shakeVariants = {
  idle: { x: 0 },
  error: { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
};

// --- COMPONENT ---
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [method, setMethod] = useState('account'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // CSS Filter for Maroon Logo (#800000)
  // This turns a black logo into the exact maroon shade requested
  const maroonFilter = "brightness(0) saturate(100%) invert(8%) sepia(94%) saturate(7466%) hue-rotate(358deg) brightness(88%) contrast(112%)";

  // Error Handling from URL
  useEffect(() => {
    if (searchParams?.get('error') === 'AccessDenied' && !error) {
      setError('Access Denied: Insufficient Privileges.');
    }
  }, [searchParams]);

  // --- 1. LOADING STATE ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#B91C1C]/10 via-black to-black"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-2 border-[#B91C1C]/20 border-t-[#B91C1C] rounded-full animate-spin"></div>
          <p className="text-[#B91C1C] font-bodoni text-lg tracking-widest uppercase animate-pulse">Authenticating</p>
        </motion.div>
      </div>
    );
  }

  // --- 2. ALREADY ADMIN STATE ---
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-manrope text-white p-4 relative overflow-hidden selection:bg-[#B91C1C] selection:text-white">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#B91C1C]/5 rounded-full blur-[100px]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111]/80 backdrop-blur-xl p-12 rounded-[2rem] border border-[#B91C1C]/20 max-w-md w-full text-center shadow-[0_0_50px_rgba(185,28,28,0.2)] relative z-10"
        >
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} 
             transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
             className="w-24 h-24 bg-gradient-to-br from-[#B91C1C] to-[#800000] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#B91C1C]/20"
           >
              <ShieldCheck size={40} className="text-white"/>
           </motion.div>
           
           <h1 className="text-4xl font-bodoni text-white mb-3">Welcome Back</h1>
           <p className="text-sm text-gray-400 mb-10 font-medium tracking-wide">
             Active Session: <span className="text-[#B91C1C] font-bold">{session.user.email}</span>
           </p>
           
           <div className="space-y-4">
             <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               onClick={() => window.location.href = '/admin/dashboard'} 
               className="w-full bg-[#B91C1C] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#991b1b] transition-all flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(185,28,28,0.3)]"
             >
               <LayoutDashboard size={18}/> Access Dashboard
             </motion.button>
             
             <motion.button 
               whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.98 }}
               onClick={() => signOut({ callbackUrl: '/admin/login' })}
               className="w-full bg-white/5 border border-white/10 text-gray-400 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
             >
               <LogOut size={16}/> Sign Out
             </motion.button>
           </div>
        </motion.div>
      </div>
    );
  }

  // --- 3. ACCESS DENIED ---
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-manrope text-white p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111] p-10 rounded-3xl border border-red-500/30 max-w-md w-full text-center shadow-[0_0_40px_rgba(220,38,38,0.2)]"
        >
           <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
              <ShieldCheck size={40}/>
           </div>
           <h1 className="text-3xl font-bodoni text-red-500 mb-3">Access Denied</h1>
           <p className="text-sm text-gray-400 mb-8 leading-relaxed">
             The account <span className="text-white font-bold">{session.user.email}</span> lacks authorization.
           </p>
           <motion.button 
             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
             onClick={() => signOut({ callbackUrl: '/admin/login' })}
             className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
           >
             <LogOut size={16}/> Sign Out & Switch
           </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- HANDLERS ---
  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const res = await loginAction(formData);
    
    if (res.success) {
      window.location.href = '/admin/dashboard';
    } else {
      setError(res.error || 'Invalid Master Key');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const email = e.target.email.value;
    const password = e.target.password.value;
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.error) {
      setError('Invalid credentials.');
      setLoading(false);
    } else {
      window.location.href = '/admin/dashboard';
    }
  };

  // --- MAIN LOGIN FORM ---
  return (
    <div className="min-h-screen bg-black flex font-manrope selection:bg-[#B91C1C] selection:text-white overflow-hidden">
      
      {/* --- LEFT: CINEMATIC VISUAL --- */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-[#0a0a0a]">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/95 via-black/50 to-transparent"></div>
        
        {/* Slow Zoom Image */}
        <motion.img 
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          src="https://images.unsplash.com/photo-1542259659-579941007202?q=80&w=2069&auto=format&fit=crop" 
          alt="Luxury" 
          className="w-full h-full object-cover opacity-60 grayscale-[30%]"
        />
        
        {/* Floating Brand Text */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-20 left-20 z-20"
        >
           <h1 className="font-bodoni text-7xl text-white leading-tight drop-shadow-2xl">
             Define<br/>
             <span className="text-[#B91C1C] italic">Excellence.</span>
           </h1>
           <div className="w-24 h-1 bg-[#B91C1C] mt-6 mb-4"></div>
           <p className="text-white/70 tracking-[0.3em] text-xs uppercase font-bold">OURA Administrative Suite</p>
        </motion.div>
      </div>

      {/* --- RIGHT: INTERACTIVE FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
        
        {/* Ambient Red Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B91C1C]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          {/* LOGO - Large & Maroon */}
          <motion.div variants={itemVariants} className="mb-12 text-center flex flex-col items-center">
             <div className="relative w-40 h-20 mb-8 opacity-100">
                <Image 
                  src="/logo.png" 
                  alt="OURA" 
                  fill 
                  className="object-contain" 
                  style={{ filter: maroonFilter }} // Applies Maroon Tint
                  priority 
                />
             </div>
             <h2 className="font-bodoni text-4xl text-white mb-3">Welcome Back</h2>
             <p className="text-gray-500 text-sm tracking-wide">Please authenticate to continue.</p>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div variants={itemVariants} className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/10 relative">
              <motion.div 
                className="absolute top-1.5 bottom-1.5 rounded-xl bg-[#B91C1C] shadow-lg z-0"
                initial={false}
                animate={{ 
                  left: method === 'account' ? '6px' : '50%', 
                  width: 'calc(50% - 6px)',
                  x: method === 'master' ? '0%' : '0%' 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button 
                onClick={() => {setMethod('account'); setError('')}} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors relative z-10 ${method === 'account' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Admin Account
              </button>
              <button 
                onClick={() => {setMethod('master'); setError('')}} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors relative z-10 ${method === 'master' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Master Key
              </button>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                variants={shakeVariants}
                initial="idle"
                animate="error"
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="flex items-center gap-3 text-[#B91C1C] text-xs bg-[#B91C1C]/10 p-4 rounded-xl border border-[#B91C1C]/20 backdrop-blur-sm font-bold tracking-wide">
                   <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-[340px] relative">
            <AnimatePresence mode="wait" initial={false}>
              
              {/* ACCOUNT LOGIN */}
              {method === 'account' && (
                <motion.div 
                  key="account"
                  initial={{ opacity: 0, x: -50 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 50 }} 
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                   {/* Google */}
                   <motion.button 
                     whileHover={{ scale: 1.01, backgroundColor: "#f3f4f6" }} 
                     whileTap={{ scale: 0.98 }}
                     onClick={() => { setLoading(true); signIn('google', { callbackUrl: '/admin/dashboard' }); }}
                     disabled={loading}
                     className="w-full bg-white text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                   >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google"/>
                      <span className="tracking-wide">Continue with Google</span>
                   </motion.button>

                   <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-black px-4 text-gray-600 font-bold">Or enter credentials</span></div>
                   </div>

                   <form onSubmit={handleEmailLogin} className="space-y-5">
                      <div className="space-y-4">
                        {/* Email Input */}
                        <div className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                           <Mail size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-[#B91C1C]' : 'text-gray-500'}`} />
                           <input 
                             name="email" type="email" required placeholder="Admin Email" 
                             onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-sm focus:border-[#B91C1C]/50 focus:bg-[#B91C1C]/5 outline-none transition-all placeholder:text-gray-600 font-medium"
                           />
                        </div>
                        {/* Password Input */}
                        <div className={`relative group transition-all duration-300 ${focusedField === 'pass' ? 'scale-[1.02]' : ''}`}>
                           <Lock size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'pass' ? 'text-[#B91C1C]' : 'text-gray-500'}`} />
                           <input 
                             name="password" type="password" required placeholder="Password" 
                             onFocus={() => setFocusedField('pass')} onBlur={() => setFocusedField(null)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-sm focus:border-[#B91C1C]/50 focus:bg-[#B91C1C]/5 outline-none transition-all placeholder:text-gray-600 font-medium"
                           />
                        </div>
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={loading} 
                        className="w-full bg-gradient-to-r from-[#B91C1C] to-[#800000] text-white h-14 rounded-2xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(185,28,28,0.25)] hover:shadow-[0_4px_30px_rgba(185,28,28,0.4)]"
                      >
                          {loading ? <Loader2 className="animate-spin" size={20}/> : 'Sign In'}
                      </motion.button>
                   </form>
                </motion.div>
              )}

              {/* MASTER KEY LOGIN */}
              {method === 'master' && (
                <motion.div 
                  key="master"
                  initial={{ opacity: 0, x: 50 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -50 }} 
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleMasterLogin} className="space-y-8 pt-4">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Secure Token Access</label>
                       <div className={`relative group transition-all duration-300 ${focusedField === 'token' ? 'scale-[1.02]' : ''}`}>
                          <KeyRound size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'token' ? 'text-[#B91C1C]' : 'text-gray-500'}`} />
                          <input 
                            name="password" type="password" required 
                            onFocus={() => setFocusedField('token')} onBlur={() => setFocusedField(null)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white text-lg tracking-[0.3em] font-mono focus:border-[#B91C1C]/50 focus:bg-[#B91C1C]/5 outline-none transition-all placeholder:text-gray-600 placeholder:tracking-normal placeholder:font-sans" 
                            placeholder="Enter Key"
                          />
                       </div>
                    </div>

                    <motion.button 
                      type="submit" 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={loading} 
                      className="w-full bg-gradient-to-r from-[#B91C1C] to-[#800000] text-white h-14 rounded-2xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(185,28,28,0.25)] hover:shadow-[0_4px_30px_rgba(185,28,28,0.4)]"
                    >
                       {loading ? <Loader2 className="animate-spin" size={20}/> : <>Unlock Panel <ArrowRight size={18}/></>}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-8 text-center w-full"
        >
           <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">&copy; {new Date().getFullYear()} OURA Luxury.</p>
        </motion.div>

      </div>
    </div>
  );
}

// --- SUSPENSE WRAPPER ---
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#B91C1C]" size={40} /></div>}>
      <LoginContent />
    </Suspense>
  );
}