'use client';
import { useState } from 'react';
import { X, Lock, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { changePassword } from '@/app/actions';

export default function ChangePasswordModal({ isOpen, onClose, showToast }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    // Server action to verify old password and update new one
    const result = await changePassword(formData);

    if (result.success) {
      showToast('Password updated successfully', 'success');
      onClose();
    } else {
      showToast(result.error || 'Failed to update password', 'error');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto p-6 md:p-8 relative">
              <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-black"><X size={20} /></button>
              
              <h2 className="text-xl font-bodoni font-bold text-gray-900 mb-1">Change Password</h2>
              <p className="text-xs text-gray-500 mb-6">Ensure your account stays secure.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="password" name="currentPassword" required className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all" placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="password" name="newPassword" required className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all" placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="password" name="confirmPassword" required className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={loading} className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Update</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}