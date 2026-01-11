'use client';

import { useState } from 'react';
import { X, Camera, Save, Loader2, User, Phone, Mail, Lock, Shield, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
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

// --- REUSABLE TOAST INSIDE MODAL ---
const ModalToast = ({ message, type }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`absolute top-4 left-4 right-16 p-3 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-sm z-50 ${
      type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}
  >
    {type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
    {message}
  </motion.div>
);

export default function EditProfileModal({ user, isOpen, onClose, userHasPassword }) {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'
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

  // --- 2. PASSWORD HANDLER ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const res = await changePassword(formData);
    if (res.success) {
      showToast('Password Changed', 'success');
      e.target.reset();
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
    
    // Logic updated in actions.js to allow skipping password if userHasPassword is false
    const res = await initiateEmailChange(formData);
    
    if (res.success) {
      setPendingEmail(emailInput);
      setEmailStep(2);
      showToast('OTP Sent', 'success');
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
      showToast('Email Updated! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
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
                 <div className="p-4 bg-white flex justify-end gap-3">
                    <button onClick={() => setCropSrc(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500">Cancel</button>
                    <button onClick={performCrop} className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg">Apply</button>
                 </div>
              </div>
            ) : (
              
              /* --- MAIN MODAL --- */
              <div className="bg-white w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl shadow-2xl pointer-events-auto flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-black"><X size={20}/></button>
                {/* Toast */}
                <AnimatePresence>{toast && <ModalToast message={toast.msg} type={toast.type} />}</AnimatePresence>

                {/* LEFT SIDEBAR (Tabs) */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col shrink-0">
                   <div className="p-8 pb-4 text-center border-b border-gray-100">
                      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white shadow-md">
                         <img src={currentImageSrc} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <h3 className="font-bodoni font-bold text-gray-900 truncate">{user.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">Settings</p>
                   </div>
                   <nav className="flex-1 p-4 space-y-1">
                      <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'}`}>
                         <User size={16} /> General
                      </button>
                      <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'}`}>
                         <Shield size={16} /> Security
                      </button>
                   </nav>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 relative bg-white">
                   
                   {/* --- TAB: GENERAL --- */}
                   {activeTab === 'general' && (
                     <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-sm mx-auto pt-4">
                        <div className="text-center mb-8">
                           <h2 className="font-bodoni text-2xl">Edit Profile</h2>
                           <p className="text-xs text-gray-400">Update your personal details.</p>
                        </div>

                        {/* Photo Change Trigger */}
                        <div className="flex justify-center mb-6">
                           <label className="cursor-pointer group relative">
                              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-[#D4AF37] transition-colors">
                                 <img src={currentImageSrc} className="w-full h-full object-cover" alt="Avatar"/>
                              </div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                 <Camera className="text-white" size={20}/>
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                           </label>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                              <input name="name" defaultValue={user.name} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all" />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Phone</label>
                              <input name="phone" defaultValue={user.phone} placeholder="+123..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all" />
                           </div>
                        </div>

                        <div className="pt-4">
                           <button disabled={loading} className="w-full py-3 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-900 disabled:opacity-70 flex items-center justify-center gap-2">
                              {loading ? <Loader2 size={14} className="animate-spin"/> : <><Save size={14}/> Save Changes</>}
                           </button>
                        </div>
                     </form>
                   )}

                   {/* --- TAB: SECURITY --- */}
                   {activeTab === 'security' && (
                     <div className="max-w-sm mx-auto pt-4 space-y-12">
                        <div className="text-center mb-4">
                           <h2 className="font-bodoni text-2xl">Security</h2>
                           <p className="text-xs text-gray-400">Manage password and email.</p>
                        </div>

                        {/* 1. CHANGE PASSWORD */}
                        {userHasPassword ? (
                            <form onSubmit={handlePasswordUpdate} className="space-y-4 border-b border-gray-100 pb-8">
                               <h3 className="text-sm font-bold flex items-center gap-2"><Lock size={14}/> Change Password</h3>
                               <input type="password" name="currentPassword" placeholder="Current Password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" />
                               <div className="grid grid-cols-2 gap-2">
                                  <input type="password" name="newPassword" placeholder="New Password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" />
                                  <input type="password" name="confirmPassword" placeholder="Confirm" required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" />
                               </div>
                               <button disabled={loading} className="w-full py-3 bg-white border border-gray-200 text-black hover:bg-black hover:text-white transition-colors rounded-lg text-xs font-bold uppercase tracking-widest">
                                  {loading ? 'Updating...' : 'Update Password'}
                               </button>
                            </form>
                        ) : (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center mb-8">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Shield size={18} />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-1">Google Account</h4>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    You are logged in via Google. Your password is managed by Google.
                                </p>
                            </div>
                        )}

                        {/* 2. CHANGE EMAIL */}
                        <div>
                           <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><Mail size={14}/> Change Email</h3>
                           {emailStep === 1 ? (
                              <form onSubmit={handleEmailInitiate} className="space-y-4">
                                 <div className="flex flex-col gap-1 opacity-50">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400">Current Email</label>
                                    <div className="text-sm font-medium">{user.email}</div>
                                 </div>
                                 
                                 <input type="email" name="newEmail" placeholder="New Email Address" required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" />
                                 
                                 {/* Only show password input if user actually has a password */}
                                 {userHasPassword && (
                                     <input type="password" name="password" placeholder="Confirm with Password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" />
                                 )}

                                 <button disabled={loading} className="w-full py-3 bg-white border border-gray-200 text-black hover:bg-black hover:text-white transition-colors rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    {loading ? <Loader2 size={14} className="animate-spin"/> : <>Send OTP <ChevronRight size={14}/></>}
                                 </button>
                              </form>
                           ) : (
                              <form onSubmit={handleEmailVerify} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                 <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-2">
                                    Enter the code sent to <b>{pendingEmail}</b>
                                 </div>
                                 <input type="text" name="otp" placeholder="XXXXXX" maxLength={6} required className="w-full bg-white border-2 border-black rounded-lg px-4 py-3 text-center text-lg font-bold tracking-[0.5em] focus:outline-none" />
                                 <div className="flex gap-2">
                                    <button type="button" onClick={() => setEmailStep(1)} className="flex-1 py-3 bg-gray-100 rounded-lg text-xs font-bold uppercase">Back</button>
                                    <button disabled={loading} className="flex-[2] py-3 bg-black text-white rounded-lg text-xs font-bold uppercase">
                                       {loading ? 'Verifying...' : 'Verify & Save'}
                                    </button>
                                 </div>
                              </form>
                           )}
                        </div>

                     </div>
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