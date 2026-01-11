'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { loginAction } from '@/app/actions'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck, KeyRound, AlertCircle, LogOut, Mail, Lock, LayoutDashboard, ChevronRight } from 'lucide-react';
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

  // Error Handling from URL
  useEffect(() => {
    if (searchParams?.get('error') === 'AccessDenied' && !error) {
      setError('Access Denied: Insufficient Privileges.');
    }
  }, [searchParams]);

  // --- 1. LOADING STATE ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#050505] to-[#050505]"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37] font-bodoni text-lg tracking-widest uppercase animate-pulse">Authenticating</p>
        </motion.div>
      </div>
    );
  }

  // --- 2. ALREADY ADMIN STATE ---
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-manrope text-white p-4 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111]/80 backdrop-blur-xl p-10 rounded-3xl border border-[#D4AF37]/20 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
        >
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} 
             transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
             className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#8a701e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D4AF37]/20"
           >
              <ShieldCheck size={36} className="text-black"/>
           </motion.div>
           
           <h1 className="text-3xl font-bodoni text-white mb-2">Welcome Back</h1>
           <p className="text-sm text-gray-400 mb-8 font-medium">
             Active Session: <span className="text-[#D4AF37]">{session.user.email}</span>
           </p>
           
           <div className="space-y-4">
             <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               onClick={() => window.location.href = '/admin/dashboard'} 
               className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-[#c5a028] transition-all flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
             >
               <LayoutDashboard size={18}/> Access Dashboard
             </motion.button>
             
             <motion.button 
               whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.98 }}
               onClick={() => signOut({ callbackUrl: '/admin/login' })}
               className="w-full bg-white/5 border border-white/10 text-gray-400 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2"
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-manrope text-white p-4">
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
    
    // Now this works because e.target is the FORM element
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
    <div className="min-h-screen bg-[#050505] flex font-manrope selection:bg-[#D4AF37] selection:text-black overflow-hidden">
      
      {/* --- LEFT: CINEMATIC VISUAL --- */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-[#0a0a0a]">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
        
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
             <span className="text-[#D4AF37] italic">Excellence.</span>
           </h1>
           <div className="w-24 h-1 bg-[#D4AF37] mt-6 mb-4"></div>
           <p className="text-white/70 tracking-[0.3em] text-xs uppercase font-bold">ANAQA Administrative Suite</p>
        </motion.div>
      </div>

      {/* --- RIGHT: INTERACTIVE FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
        
        {/* Ambient Gold Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="mb-10 text-center">
             <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent text-[#D4AF37] mb-6 border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-md">
                <ShieldCheck size={28} />
             </div>
             <h2 className="font-bodoni text-4xl text-white mb-2">Welcome Back</h2>
             <p className="text-gray-500 text-sm">Please authenticate to continue.</p>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div variants={itemVariants} className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/10 relative">
             <motion.div 
               className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-lg z-0"
               initial={false}
               animate={{ 
                 left: method === 'account' ? '6px' : '50%', 
                 width: 'calc(50% - 6px)',
                 x: method === 'master' ? '0%' : '0%' // Adjust if needed
               }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
             />
             <button 
               onClick={() => {setMethod('account'); setError('')}} 
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors relative z-10 ${method === 'account' ? 'text-black' : 'text-gray-500 hover:text-white'}`}
             >
               Admin Account
             </button>
             <button 
               onClick={() => {setMethod('master'); setError('')}} 
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors relative z-10 ${method === 'master' ? 'text-black' : 'text-gray-500 hover:text-white'}`}
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
                <div className="flex items-center gap-3 text-red-400 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 backdrop-blur-sm">
                   <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-[320px] relative">
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
                     className="w-full bg-white text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg"
                   >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google"/>
                      <span>Continue with Google</span>
                   </motion.button>

                   <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#050505] px-4 text-gray-600 font-bold">Or enter credentials</span></div>
                   </div>

                   <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-4">
                        {/* Email Input */}
                        <div className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                           <Mail size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                           <input 
                             name="email" type="email" required placeholder="Admin Email" 
                             onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-sm focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 outline-none transition-all placeholder:text-gray-600"
                           />
                        </div>
                        {/* Password Input */}
                        <div className={`relative group transition-all duration-300 ${focusedField === 'pass' ? 'scale-[1.02]' : ''}`}>
                           <Lock size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'pass' ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                           <input 
                             name="password" type="password" required placeholder="Password" 
                             onFocus={() => setFocusedField('pass')} onBlur={() => setFocusedField(null)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-sm focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 outline-none transition-all placeholder:text-gray-600"
                           />
                        </div>
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={loading} 
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#bfa03a] text-black h-14 rounded-2xl font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_4px_30px_rgba(212,175,55,0.4)]"
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
                  {/* WRAPPED IN FORM ELEMENT SO FormData WORKS */}
                  <form onSubmit={handleMasterLogin} className="space-y-8 pt-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Secure Token Access</label>
                       <div className={`relative group transition-all duration-300 ${focusedField === 'token' ? 'scale-[1.02]' : ''}`}>
                          <KeyRound size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'token' ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                          <input 
                            name="password" type="password" required 
                            onFocus={() => setFocusedField('token')} onBlur={() => setFocusedField(null)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white text-lg tracking-widest focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 outline-none transition-all placeholder:text-gray-600" 
                            placeholder="•••• •••• ••••"
                          />
                       </div>
                    </div>

                    <motion.button 
                      type="submit" // changed to type submit
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={loading} 
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#bfa03a] text-black h-14 rounded-2xl font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_4px_30px_rgba(212,175,55,0.4)]"
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
           <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">&copy; {new Date().getFullYear()} ANAQA Luxury.</p>
        </motion.div>

      </div>
    </div>
  );
}

// --- SUSPENSE WRAPPER ---
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>}>
      <LoginContent />
    </Suspense>
  );
}