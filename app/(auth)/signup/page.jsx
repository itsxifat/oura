'use client';

import { signupAction } from "@/app/authActions";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Phone, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { staggerChildren: 0.05, delayChildren: 0.1, duration: 0.4 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const shakeVariants = {
  idle: { x: 0 },
  error: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError("");
    
    const res = await signupAction(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/verify?email=${encodeURIComponent(formData.get('email'))}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] font-manrope px-4 relative overflow-hidden">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white via-[#faf9f6] to-[#faf9f6] -z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-black/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- MAIN CARD --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/60 backdrop-blur-xl w-full max-w-md relative z-10"
      >
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <motion.span variants={itemVariants} className="font-bodoni text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-bold mb-3 block">
            Begin Your Journey
          </motion.span>
          <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-bodoni font-medium text-gray-900">
            Create Account
          </motion.h1>
        </div>
        
        {/* ERROR NOTIFICATION */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              variants={shakeVariants}
              initial="idle"
              animate="error"
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form action={handleSubmit} className="space-y-5">
          
          {/* Name Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
            <User className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'name' ? 'text-[#D4AF37]' : 'text-gray-400'}`} size={18} />
            <input 
              name="name" type="text" placeholder="Full Name" required 
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-[#D4AF37]/30 focus:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Email Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
            <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-[#D4AF37]' : 'text-gray-400'}`} size={18} />
            <input 
              name="email" type="email" placeholder="Email Address" required 
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-[#D4AF37]/30 focus:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Phone Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300 ${focusedField === 'phone' ? 'scale-[1.02]' : ''}`}>
            <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'phone' ? 'text-[#D4AF37]' : 'text-gray-400'}`} size={18} />
            <input 
              name="phone" type="tel" placeholder="Phone Number" required 
              onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-[#D4AF37]/30 focus:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
            <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-[#D4AF37]' : 'text-gray-400'}`} size={18} />
            <input 
              name="password" type="password" placeholder="Password" required 
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-[#D4AF37]/30 focus:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400" 
            />
          </motion.div>
          
          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <button 
              disabled={loading} 
              className="w-full bg-black text-white h-14 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#D4AF37] hover:text-white disabled:opacity-70 flex justify-center items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center mt-10">
          <p className="text-xs text-gray-500 font-medium">
            Already a member? <Link href="/login" className="text-black font-bold uppercase tracking-wider border-b border-black/20 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all pb-0.5 ml-1">Log In</Link>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
}