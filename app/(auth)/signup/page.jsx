'use client';

import { signupAction } from "@/app/authActions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; 
import { signIn } from "next-auth/react"; // Import signIn for Google
import { Loader2, User, Mail, Phone, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { staggerChildren: 0.08, delayChildren: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
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
    <div className="min-h-screen flex items-center justify-center bg-white font-manrope px-4 relative overflow-hidden selection:bg-[#B91C1C] selection:text-white">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#B91C1C]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />

      {/* --- MAIN CARD --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-[#B91C1C]/5 border border-gray-100 w-full max-w-md relative z-10"
      >
        
        {/* HEADER */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div variants={itemVariants} className="relative w-24 h-12 mb-6">
             <Image src="/logo.png" alt="OURA" fill className="object-contain" priority />
          </motion.div>
          <motion.span variants={itemVariants} className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B91C1C] mb-2 block">
            Membership
          </motion.span>
          <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-bodoni text-black">
            Create Account
          </motion.h1>
        </div>
        
        {/* ERROR NOTIFICATION */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-50 border border-[#B91C1C]/20 text-[#B91C1C] px-4 py-3 text-xs font-bold rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form action={handleSubmit} className="space-y-4">
          
          {/* Name Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300`}>
            <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'name' ? 'text-[#B91C1C]' : 'text-gray-400'}`} size={18} />
            <input 
              name="name" type="text" placeholder="Full Name" required 
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Email Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300`}>
            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-[#B91C1C]' : 'text-gray-400'}`} size={18} />
            <input 
              name="email" type="email" placeholder="Email Address" required 
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Phone Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300`}>
            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'phone' ? 'text-[#B91C1C]' : 'text-gray-400'}`} size={18} />
            <input 
              name="phone" type="tel" placeholder="Phone Number" required 
              onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" 
            />
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className={`relative group transition-all duration-300`}>
            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-[#B91C1C]' : 'text-gray-400'}`} size={18} />
            <input 
              name="password" type="password" placeholder="Password" required 
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all placeholder:text-gray-400" 
            />
          </motion.div>
          
          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <button 
              disabled={loading} 
              className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#B91C1C] hover:text-white disabled:opacity-70 flex justify-center items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-[#B91C1C]/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative my-8 text-center">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-100"></div>
          <span className="bg-white px-3 relative z-10 text-[9px] text-gray-400 uppercase tracking-widest font-bold">Or continue with</span>
        </motion.div>

        {/* Google Button */}
        <motion.div variants={itemVariants}>
          <button onClick={() => signIn('google', { callbackUrl: '/' })} className="group w-full bg-white border border-gray-200 h-14 rounded-xl font-bold text-sm text-gray-700 hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-[0.99] duration-300">
            <div className="p-1.5 bg-white rounded-full border border-gray-100 group-hover:border-[#B91C1C]/20 transition-colors">
               <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
            </div>
            <span>Google</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <p className="text-xs text-gray-500 font-medium">
            Already a member? <Link href="/login" className="text-black font-bold uppercase tracking-wider border-b border-transparent hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all pb-0.5 ml-1">Log In</Link>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
}