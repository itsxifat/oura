'use client';

import { requestPasswordReset } from "@/app/passwordActions";
import { useState } from "react";
import Link from "next/link";
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } }
  };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] font-manrope px-4 py-8 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#faf9f6] to-[#faf9f6] -z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/60 backdrop-blur-xl w-full max-w-md relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <span className="font-tenor text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 block font-bold">Recovery</span>
          <h1 className="text-3xl md:text-4xl font-bodoni font-medium text-gray-900">Reset Access</h1>
          <p className="text-xs text-gray-400 mt-2 font-medium">Enter your email to receive a secure link.</p>
        </motion.div>
        
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 overflow-hidden border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {status.type !== 'success' ? (
          <form action={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
              <input name="email" type="email" placeholder="Email Address" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all placeholder:text-gray-400" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <button disabled={loading} className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#D4AF37] disabled:opacity-70 flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Send Link <ArrowRight size={14} /></>}
              </button>
            </motion.div>
          </form>
        ) : (
           <motion.div variants={itemVariants}>
              <Link href="/login" className="w-full bg-white border border-gray-200 text-black h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:border-black flex justify-center items-center gap-2 transition-all shadow-sm">
                 Return to Login
              </Link>
           </motion.div>
        )}

        <motion.div variants={itemVariants} className="text-center mt-8">
          <Link href="/login" className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors font-bold border-b border-transparent hover:border-black pb-0.5">
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}