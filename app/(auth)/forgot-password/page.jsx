'use client';

import { requestPasswordReset } from "@/app/passwordActions";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (formData) => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    const res = await requestPasswordReset(formData);
    
    setLoading(false);
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
    } else {
      setStatus({ type: 'success', message: res.message });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 } 
    }
  };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-manrope px-4 py-8 relative overflow-hidden selection:bg-[#B91C1C] selection:text-white">
      
      {/* Background Decor (Red Shade) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#B91C1C]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-[#B91C1C]/5 border border-gray-100 w-full max-w-md relative z-10"
      >
        {/* Header with Logo */}
        <motion.div variants={itemVariants} className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-20 h-10 mb-6">
             <Image 
               src="/logo.png" 
               alt="OURA" 
               fill 
               className="object-contain" 
               priority
             />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B91C1C] mb-2 block">
            Account Recovery
          </span>
          <h1 className="text-3xl md:text-4xl font-bodoni text-black">
            Reset Password
          </h1>
          <p className="text-xs text-gray-400 mt-3 font-medium leading-relaxed max-w-xs">
            Enter your email address and we'll send you a secure link to reset your access.
          </p>
        </motion.div>
        
        {/* Status Message */}
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className={`px-4 py-3 text-xs font-bold rounded-lg flex items-center gap-2 overflow-hidden border ${
                status.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-[#B91C1C] border-[#B91C1C]/20'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {status.type !== 'success' ? (
          <form action={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B91C1C] transition-colors" size={18} />
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <button disabled={loading} className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#B91C1C] disabled:opacity-70 flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-[#B91C1C]/20 active:scale-[0.98] duration-300">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Send Secure Link <ArrowRight size={14} /></>}
              </button>
            </motion.div>
          </form>
        ) : (
           <motion.div variants={itemVariants}>
              <Link href="/login" className="w-full bg-white border border-gray-200 text-black h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:border-black flex justify-center items-center gap-2 transition-all shadow-sm active:scale-[0.98]">
                 Return to Login
              </Link>
           </motion.div>
        )}

        <motion.div variants={itemVariants} className="text-center mt-8">
          <Link href="/login" className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#B91C1C] transition-colors font-bold border-b border-transparent hover:border-[#B91C1C] pb-0.5">
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}