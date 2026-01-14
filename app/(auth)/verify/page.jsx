'use client';

import { verifyOtpAction } from "@/app/authActions";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image"; // Import for logo
import { Loader2, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const shakeVariants = {
  idle: { x: 0 },
  error: { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
};

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' }); 
  const [timer, setTimer] = useState(30);

  // Countdown Timer for Resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e?.preventDefault(); // Handle both button click and Enter key
    
    if(!otp || otp.length < 6) return;
    
    setLoading(true);
    setStatus({ type: '', message: '' });

    const res = await verifyOtpAction(email, otp);
    
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
      setLoading(false);
    } else {
      setStatus({ type: 'success', message: 'Identity Verified. Redirecting...' });
      setTimeout(() => router.push('/login?verified=true'), 1500);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-[#B91C1C]/5 border border-gray-100 w-full max-w-md text-center relative z-10 overflow-hidden"
    >
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B91C1C] to-transparent opacity-50"></div>

      {/* Header with Logo */}
      <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
         <div className="relative w-20 h-10 mb-6">
            <Image src="/logo.png" alt="OURA" fill className="object-contain" priority />
         </div>
         <div className="w-14 h-14 bg-[#B91C1C]/5 text-[#B91C1C] rounded-full flex items-center justify-center shadow-sm border border-[#B91C1C]/10 mb-4">
            <ShieldCheck size={28} strokeWidth={1.5} />
         </div>
         <h1 className="text-3xl font-bodoni font-medium text-gray-900 mb-2">
           Verification
         </h1>
         <p className="text-gray-500 text-xs font-manrope tracking-wide leading-relaxed">
           Please enter the 6-digit secure code sent to <br/> 
           <span className="font-bold text-black border-b border-gray-200 pb-0.5">{email}</span>
         </p>
      </motion.div>

      {/* NOTIFICATION AREA */}
      <AnimatePresence mode="wait">
        {status.message && (
          <motion.div 
            key={status.type}
            variants={shakeVariants}
            initial="idle"
            animate={status.type === 'error' ? 'error' : 'idle'}
            className={`px-4 py-3 rounded-lg mb-6 flex items-center justify-center gap-2 text-xs font-bold ${
              status.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-[#B91C1C] border border-[#B91C1C]/20'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT FIELD */}
      <motion.div variants={itemVariants} className="relative mb-8 group">
        <input 
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          className="w-full text-center text-3xl tracking-[0.5em] font-bodoni font-bold border-b border-gray-200 focus:border-[#B91C1C] outline-none py-4 bg-transparent transition-all placeholder:tracking-normal placeholder:font-manrope placeholder:text-xs placeholder:font-normal placeholder:text-gray-300 placeholder:uppercase selection:bg-[#B91C1C] selection:text-white" 
          maxLength={6}
          placeholder="Enter Code"
          autoFocus
        />
      </motion.div>

      {/* VERIFY BUTTON */}
      <motion.button 
        variants={itemVariants}
        onClick={handleVerify} 
        disabled={loading || otp.length < 6} 
        className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#B91C1C] hover:text-white disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-[#B91C1C]/20 active:scale-[0.98]"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : (
          <>Verify Identity <ArrowRight size={16} /></>
        )}
      </motion.button>

      {/* RESEND LOGIC */}
      <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Didn't receive it?</p>
        
        {timer > 0 ? (
           <span className="text-[10px] text-gray-300 font-mono">Resend available in 00:{timer < 10 ? `0${timer}` : timer}</span>
        ) : (
           <button 
             onClick={() => { setTimer(30); setStatus({ type: 'success', message: 'Code resent successfully.' }); setTimeout(() => setStatus({type:'', message:''}), 3000) }}
             className="text-[10px] text-black font-bold uppercase tracking-widest border-b border-black hover:text-[#B91C1C] hover:border-[#B91C1C] transition-colors pb-0.5"
           >
             Resend Code
           </button>
        )}
      </motion.div>

    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-manrope relative overflow-hidden px-4 selection:bg-[#B91C1C] selection:text-white">
       
       {/* Background Ambience */}
       <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#B91C1C]/5 rounded-full blur-[150px]" />
       <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />

       <Suspense fallback={
         <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
         </div>
       }>
         <VerifyForm />
       </Suspense>
    </div>
  );
}