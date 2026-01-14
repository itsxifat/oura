'use client';

import { useState } from 'react';
// ✅ FIX: Added 'Info' to imports
import { X, Camera, Save, Loader2, User, Phone, Mail, Lock, Shield, CheckCircle, AlertCircle, ChevronRight, KeyRound, Info } from 'lucide-react';
import { updateUserProfile, changePassword, initiateEmailChange, verifyEmailChangeOTP } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import Cropper from 'react-easy-crop';

// --- UTILITY: Create Cropped Image Blob ---
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

// --- REUSABLE TOAST ---
const ModalToast = ({ message, type }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`absolute top-6 left-6 right-16 p-3 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-sm z-50 ${
      type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-[#B91C1C] border border-[#B91C1C]/20'
    }`}
  >
    {type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
    {message}
  </motion.div>
);

export default function EditProfileModal({ user, isOpen, onClose, userHasPassword }) {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // --- IMAGE CROP STATES ---
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(null);
  const [blobForUpload, setBlobForUpload] = useState(null);

  // --- SECURITY STATES ---
  const [emailStep, setEmailStep] = useState(1); // 1: Form, 2: OTP
  const [pendingEmail, setPendingEmail] = useState('');

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- 1. GENERAL PROFILE HANDLERS ---
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setCropSrc(reader.result);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const performCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropSrc, croppedAreaPixels); 
      setPreview(URL.createObjectURL(croppedBlob));
      setBlobForUpload(croppedBlob);
      setCropSrc(null);
    } catch (e) { showToast('Error cropping image', 'error'); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    if (blobForUpload) formData.append('image', blobForUpload, 'pfp.jpg');
    formData.append('email', user.email); 

    const res = await updateUserProfile(formData);
    if (res.success) {
      showToast('Profile Updated', 'success');
      await update();
      setTimeout(() => onClose(), 1000);
    } else {
      showToast(res.error || 'Failed', 'error');
    }
    setLoading(false);
  };

  // --- 2. PASSWORD HANDLER (Hybrid Support) ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const res = await changePassword(formData);
    if (res.success) {
      showToast('Password Updated Successfully', 'success');
      e.target.reset();
      // Optionally reload to update userHasPassword state if needed, 
      // or rely on next session check
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  // --- 3. EMAIL HANDLERS ---
  const handleEmailInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const emailInput = formData.get('newEmail');
    
    const res = await initiateEmailChange(formData);
    
    if (res.success) {
      setPendingEmail(emailInput);
      setEmailStep(2);
      showToast('Verification Code Sent', 'success');
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append('newEmail', pendingEmail);
    const res = await verifyEmailChangeOTP(formData);
    if (res.success) {
      showToast('Email Changed! Please login again.', 'success');
      // Force logout as session email is now invalid
      setTimeout(() => window.location.href = '/login', 2000);
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  const currentImageSrc = preview || user.image || `https://ui-avatars.com/api/?name=${user.name}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
            
            {/* --- CROPPER UI --- */}
            {cropSrc ? (
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden h-[500px] flex flex-col">
                 <div className="relative flex-1 bg-black">
                    <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(a, b) => setCroppedAreaPixels(b)} onZoomChange={setZoom} cropShape="round" showGrid={false} />
                 </div>
                 <div className="p-4 bg-white flex justify-end gap-3 border-t border-gray-100">
                    <button onClick={() => setCropSrc(null)} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Cancel</button>
                    <button onClick={performCrop} className="px-8 py-3 bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-colors shadow-lg">Apply</button>
                 </div>
              </div>
            ) : (
              
              /* --- MAIN MODAL --- */
              <div className="bg-white w-full max-w-4xl h-[85vh] max-h-[650px] rounded-2xl shadow-2xl pointer-events-auto flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-50 rounded-full transition text-gray-400 hover:text-[#B91C1C]"><X size={20}/></button>
                {/* Toast */}
                <AnimatePresence>{toast && <ModalToast message={toast.msg} type={toast.type} />}</AnimatePresence>

                {/* LEFT SIDEBAR */}
                <div className="w-full md:w-72 bg-gray-50/50 border-r border-gray-100 flex flex-col shrink-0">
                   <div className="p-8 pb-6 text-center border-b border-gray-100 bg-white">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gray-50 shadow-inner group relative">
                         <img src={currentImageSrc} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <h3 className="font-bodoni text-xl font-bold text-gray-900 truncate px-2">{user.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Manage Account</p>
                   </div>
                   <nav className="flex-1 p-6 space-y-2">
                      <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'general' ? 'bg-black text-white shadow-lg shadow-black/10 translate-x-1' : 'text-gray-400 hover:bg-white hover:text-[#B91C1C]'}`}>
                         <User size={16} /> General
                      </button>
                      <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'security' ? 'bg-black text-white shadow-lg shadow-black/10 translate-x-1' : 'text-gray-400 hover:bg-white hover:text-[#B91C1C]'}`}>
                         <Shield size={16} /> Security
                      </button>
                   </nav>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white relative custom-scrollbar">
                   
                   {/* --- TAB: GENERAL --- */}
                   {activeTab === 'general' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto pt-2">
                        <div className="mb-10">
                           <h2 className="font-bodoni text-3xl text-gray-900 mb-2">Edit Profile</h2>
                           <p className="text-xs text-gray-400 uppercase tracking-wide">Update your personal details below.</p>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                           <div className="flex items-center gap-6 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                 <img src={currentImageSrc} className="w-full h-full object-cover" alt="Avatar"/>
                              </div>
                              <div>
                                 <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-[#B91C1C] hover:text-[#B91C1C] transition-colors shadow-sm">
                                    <Camera size={14}/> Change Photo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                 </label>
                                 <p className="text-[10px] text-gray-400 mt-2">JPG, PNG or GIF. Max 1MB.</p>
                              </div>
                           </div>

                           <div className="space-y-5">
                              <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                                 <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input name="name" defaultValue={user.name} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] outline-none transition-all placeholder:text-gray-300" />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                                 <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input name="phone" defaultValue={user.phone} placeholder="+123..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] outline-none transition-all placeholder:text-gray-300" />
                                 </div>
                              </div>
                           </div>

                           <div className="pt-6 border-t border-gray-50">
                              <button disabled={loading} className="w-full py-4 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#B91C1C] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] duration-200">
                                 {loading ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> Save Changes</>}
                              </button>
                           </div>
                        </form>
                     </motion.div>
                   )}

                   {/* --- TAB: SECURITY --- */}
                   {activeTab === 'security' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto pt-2 space-y-10">
                        <div className="mb-6">
                           <h2 className="font-bodoni text-3xl text-gray-900 mb-2">Security</h2>
                           <p className="text-xs text-gray-400 uppercase tracking-wide">Manage password and contact info.</p>
                        </div>

                        {/* 1. CHANGE PASSWORD (HYBRID SUPPORT) */}
                        <div className="space-y-6">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-[#B91C1C] border-b border-gray-100 pb-2 flex items-center gap-2">
                              <Lock size={14}/> {userHasPassword ? 'Change Password' : 'Set Password'}
                           </h3>
                           
                           {/* ✅ FIX: Always allow form, just hide 'Current Password' if no password exists */}
                           <form onSubmit={handlePasswordUpdate} className="space-y-4">
                              {userHasPassword && (
                                <div className="relative">
                                    <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input type="password" name="currentPassword" placeholder="Current Password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-[#B91C1C] focus:bg-white outline-none transition-all" />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                 <input type="password" name="newPassword" placeholder="New Password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-[#B91C1C] focus:bg-white outline-none transition-all" />
                                 <input type="password" name="confirmPassword" placeholder="Confirm" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-[#B91C1C] focus:bg-white outline-none transition-all" />
                              </div>
                              <button disabled={loading} className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                 {loading ? <Loader2 size={14} className="animate-spin"/> : (userHasPassword ? 'Update Password' : 'Set Password')}
                              </button>
                           </form>
                        </div>

                        {/* 2. CHANGE EMAIL */}
                        <div className="space-y-6 pt-4">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-[#B91C1C] border-b border-gray-100 pb-2 flex items-center gap-2">
                              <Mail size={14}/> Email Address
                           </h3>
                           
                           {emailStep === 1 ? (
                              <form onSubmit={handleEmailInitiate} className="space-y-4">
                                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                    <div>
                                       <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Current Email</label>
                                       <div className="text-sm font-bold text-gray-900">{user.email}</div>
                                    </div>
                                    <CheckCircle size={18} className="text-green-500" />
                                 </div>
                                 
                                 <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input type="email" name="newEmail" placeholder="New Email Address" required className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-[#B91C1C] outline-none transition-all" />
                                 </div>
                                 
                                 {/* ✅ FIX: Only require password for Email Change IF user HAS one */}
                                 {userHasPassword && (
                                    <div className="relative">
                                       <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                       <input type="password" name="password" placeholder="Confirm with Password" required className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-[#B91C1C] outline-none transition-all" />
                                    </div>
                                 )}

                                 <button disabled={loading} className="w-full py-3.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2 shadow-md">
                                    {loading ? <Loader2 size={14} className="animate-spin"/> : <>Send Verification Code <ChevronRight size={14}/></>}
                                 </button>
                              </form>
                           ) : (
                              <form onSubmit={handleEmailVerify} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                 <div className="bg-[#B91C1C]/5 p-4 rounded-xl text-xs text-[#B91C1C] border border-[#B91C1C]/10 flex items-start gap-3">
                                    <Info size={16} className="shrink-0 mt-0.5"/>
                                    <span>We sent a 6-digit code to <b>{pendingEmail}</b>. Please enter it below to confirm.</span>
                                 </div>
                                 <input type="text" name="otp" placeholder="0 0 0 0 0 0" maxLength={6} required className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-xl font-bold tracking-[0.5em] focus:border-[#B91C1C] focus:text-[#B91C1C] outline-none transition-all placeholder:text-gray-200" />
                                 <div className="flex gap-3">
                                    <button type="button" onClick={() => setEmailStep(1)} className="flex-1 py-3.5 bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-colors">Back</button>
                                    <button disabled={loading} className="flex-[2] py-3.5 bg-[#B91C1C] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg">
                                       {loading ? 'Verifying...' : 'Verify & Update'}
                                    </button>
                                 </div>
                              </form>
                           )}
                        </div>

                     </motion.div>
                   )}

                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}