'use client';

import { resetPassword } from "@/app/passwordActions";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const containerVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-white/60 w-full max-w-md relative z-10">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <span className="font-tenor text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 block font-bold">Security</span>
          <h1 className="text-3xl md:text-4xl font-bodoni font-medium text-gray-900">New Password</h1>
        </motion.div>
        
        <AnimatePresence>
          {status.message && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`px-4 py-3 mb-6 text-xs font-bold rounded-xl flex items-center gap-2 border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
              <input name="password" type="password" placeholder="New Password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20" />
            </motion.div>
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
              <input name="confirm" type="password" placeholder="Confirm Password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20" />
            </motion.div>
            <motion.div variants={itemVariants} className="pt-2">
              <button disabled={loading} className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#D4AF37] disabled:opacity-70 flex justify-center items-center gap-2 transition-all shadow-lg">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Update & Login <ArrowRight size={14} /></>}
              </button>
            </motion.div>
        </form>
      </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] font-manrope px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#faf9f6] to-[#faf9f6] -z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      <Suspense fallback={<Loader2 className="animate-spin text-[#D4AF37]" size={40} />}>
        <ResetForm />
      </Suspense>
    </div>
  );
}