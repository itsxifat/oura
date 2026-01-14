'use client';

import { resetPassword } from "@/app/passwordActions";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPass = e.target.password.value;
    const confirmPass = e.target.confirm.value;

    if(newPass !== confirmPass) {
        setStatus({ type: 'error', message: 'Passwords do not match.' });
        return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    
    const res = await resetPassword(token, newPass);
    
    setLoading(false);
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
    } else {
      setStatus({ type: 'success', message: 'Password updated. Redirecting...' });
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  const containerVariants = { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-[#B91C1C]/5 border border-gray-100 w-full max-w-md relative z-10">
        
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-20 h-10 mb-6">
             <Image src="/logo.png" alt="OURA" fill className="object-contain" priority />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B91C1C] mb-2 block">Security Update</span>
          <h1 className="text-3xl md:text-4xl font-bodoni text-black">New Password</h1>
        </motion.div>
        
        {/* Status Messages */}
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

        <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B91C1C] transition-colors" size={18} />
              <input name="password" type="password" placeholder="New Password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B91C1C] transition-colors" size={18} />
              <input name="confirm" type="password" placeholder="Confirm Password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="pt-2">
              <button disabled={loading} className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#B91C1C] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-[#B91C1C]/20 active:scale-[0.98] duration-300">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Update & Login <ArrowRight size={14} /></>}
              </button>
            </motion.div>
        </form>
      </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-manrope px-4 py-8 relative overflow-hidden selection:bg-[#B91C1C] selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#B91C1C]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />
      
      <Suspense fallback={<Loader2 className="animate-spin text-[#B91C1C]" size={40} />}>
        <ResetForm />
      </Suspense>
    </div>
  );
}