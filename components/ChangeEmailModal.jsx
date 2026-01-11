'use client';
import { useState } from 'react';
import { X, Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initiateEmailChange, verifyEmailChangeOTP } from '@/app/actions'; // Server actions

export default function ChangeEmailModal({ isOpen, onClose, showToast, userEmail }) {
  const [step, setStep] = useState(1); // 1: Password & New Email, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const emailInput = formData.get('newEmail');
    
    const result = await initiateEmailChange(formData); // Verify password and send OTP to new email

    if (result.success) {
      setNewEmail(emailInput);
      setStep(2);
      showToast('OTP sent to your new email', 'success');
    } else {
      showToast(result.error || 'Failed to initiate change', 'error');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append('newEmail', newEmail);

    const result = await verifyEmailChangeOTP(formData);

    if (result.success) {
      showToast('Email updated successfully! Please login again.', 'success');
      setTimeout(() => window.location.reload(), 1500); // Reload to force session update/logout
      onClose();
    } else {
      showToast(result.error || 'Invalid OTP', 'error');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto p-6 md:p-8 relative overflow-hidden">
              <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-black"><X size={20} /></button>
              
              <h2 className="text-xl font-bodoni font-bold text-gray-900 mb-1">Change Email Address</h2>
              <p className="text-xs text-gray-500 mb-6">Current: {userEmail}</p>

              {step === 1 ? (
                <form onSubmit={handleInitiate} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="password" name="password" required className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all" placeholder="Verify it's you" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">New Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="email" name="newEmail" required className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all" placeholder="new@email.com" />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button disabled={loading} className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2">
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <>Next <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail size={20} />
                    </div>
                    <p className="text-sm text-gray-600">We sent a verification code to <span className="font-bold text-black">{newEmail}</span></p>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Enter OTP</label>
                    <input type="text" name="otp" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg tracking-widest font-bold focus:border-black focus:ring-0 outline-none transition-all" placeholder="XXXXXX" maxLength={6} />
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">Back</button>
                    <button disabled={loading} className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2">
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Verify & Update</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}