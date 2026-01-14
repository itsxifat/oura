'use client';

import { addSlide, updateSlide, deleteSlide } from '@/app/actions';
import { useRef, useState, useEffect } from 'react';
import { 
  Trash2, Loader2, Link as LinkIcon, 
  Smartphone, Monitor, Image as ImageIcon, 
  Plus, X, Edit3, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TOAST NOTIFICATION ---
const Toast = ({ notification, onClose }) => {
  if (!notification) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] border ${
        notification.type === 'success' 
          ? 'bg-[#800000] text-white border-[#D4AF37]' 
          : 'bg-red-50 text-red-600 border-red-200'
      }`}
    >
      {notification.type === 'success' ? <CheckCircle2 size={18} className="text-[#D4AF37]"/> : <XCircle size={18}/>}
      <div><h4 className="text-xs font-bold uppercase tracking-widest">{notification.title}</h4></div>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={14}/></button>
    </motion.div>
  );
};

export default function CarouselClient({ slides }) {
  const formRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null); 
  
  // Previews
  const [desktopPreview, setDesktopPreview] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const openCreate = () => {
    setEditingSlide(null);
    setDesktopPreview(null);
    setMobilePreview(null);
    formRef.current?.reset();
    setIsFormOpen(true);
  };

  const openEdit = (slide) => {
    setEditingSlide(slide);
    setDesktopPreview(slide.image);
    setMobilePreview(slide.mobileImage);
    setIsFormOpen(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSlide(null);
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'desktop') setDesktopPreview(url);
      if (type === 'mobile') setMobilePreview(url);
    }
  };

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      let res;
      if (editingSlide) {
        formData.append('id', editingSlide._id);
        res = await updateSlide(formData);
      } else {
        res = await addSlide(formData);
      }

      if (res.error) {
        setNotification({ type: 'error', title: 'Error', message: res.error });
      } else {
        setNotification({ type: 'success', title: 'Success', message: 'Saved successfully' });
        closeForm();
      }
    } catch (err) {
      setNotification({ type: 'error', title: 'Error', message: 'Failed' });
    } finally { 
      setIsSubmitting(false); 
    }
  }

  async function handleDelete(id) {
    if(!confirm("Delete this slide?")) return;
    const res = await deleteSlide(id);
    if (res.success) setNotification({ type: 'success', title: 'Deleted' });
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8">
      <AnimatePresence>
        {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8 gap-4">
          <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.3em] text-[10px]">Visual Merchandising</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Hero Carousel</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage homepage banners and promotional slides.</p>
          </div>
        </div>

        {/* CREATE BUTTON / FORM TOGGLE */}
        {!isFormOpen ? (
           <button onClick={openCreate} className="group flex items-center gap-3 bg-[#800000] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl shadow-[#800000]/20 mb-12">
             <Plus size={18} /> Add New Slide
           </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative font-manrope mb-12 overflow-hidden"
          >
             {/* Decorative Corner */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#800000]/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

             <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6 relative z-10">
                <div>
                    <span className="text-[#800000] font-bold uppercase tracking-[0.2em] text-[10px] block mb-1">Configuration</span>
                    <h3 className="font-bodoni text-2xl text-black">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
                </div>
                <button onClick={closeForm} className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20}/></button>
             </div>

             <form ref={formRef} action={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Desktop Image */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#800000] flex items-center gap-2">
                         <Monitor size={14}/> Desktop Image <span className="text-red-500">*</span>
                      </label>
                      <div className="relative aspect-[16/9] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden group hover:border-[#800000] transition-colors">
                         {(desktopPreview || editingSlide?.image) ? (
                            <img src={desktopPreview || editingSlide.image} className="w-full h-full object-cover" />
                         ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                               <ImageIcon size={32}/>
                               <span className="text-[10px] uppercase font-bold mt-2">Upload Image</span>
                            </div>
                         )}
                         <input 
                           type="file" name="image" accept="image/*" 
                           onChange={(e) => handleImageChange(e, 'desktop')}
                           required={!editingSlide}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: 1920x1080px (Landscape)</p>
                   </div>

                   {/* Mobile Image */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                         <Smartphone size={14}/> Mobile Image (Optional)
                      </label>
                      <div className="relative aspect-[16/9] md:aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden group hover:border-[#800000] transition-colors md:max-w-[200px]">
                         {(mobilePreview || editingSlide?.mobileImage) ? (
                            <img src={mobilePreview || editingSlide.mobileImage} className="w-full h-full object-cover" />
                         ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                               <ImageIcon size={32}/>
                               <span className="text-[10px] uppercase font-bold mt-2">Upload Image</span>
                            </div>
                         )}
                         <input 
                           type="file" name="mobileImage" accept="image/*" 
                           onChange={(e) => handleImageChange(e, 'mobile')}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: 1080x1920px (Portrait)</p>
                   </div>
                </div>

                {/* Link */}
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Destination Link</label>
                   <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#800000] transition-colors">
                      <LinkIcon size={16} className="text-[#D4AF37]"/>
                      <input 
                          name="link" 
                          defaultValue={editingSlide?.link || ''}
                          placeholder="/collections/winter-sale" 
                          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-300"
                      />
                   </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                   <button type="button" onClick={closeForm} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                   <button disabled={isSubmitting} className="bg-[#800000] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-lg shadow-[#800000]/20 disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : (editingSlide ? 'Update Slide' : 'Publish Slide')}
                   </button>
                </div>
             </form>
          </motion.div>
        )}

        {/* SLIDE GRID */}
        {slides.length === 0 && !isFormOpen ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 mx-auto">
                  <ImageIcon size={32} className="opacity-20 text-black"/>
               </div>
               <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No active slides</p>
               <p className="text-xs mt-1 text-gray-300">Add a new slide to get started.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slides.map((slide) => (
                <div key={slide._id} className="group relative bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#800000]/30 transition-all duration-300 overflow-hidden">
                  
                  {/* Image Thumbnail */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-100">
                     <img src={slide.image || '/placeholder.jpg'} alt="Slide" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     
                     {/* Mobile Indicator Badge */}
                     {slide.mobileImage && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-sm shadow-sm" title="Mobile Image Available">
                           <Smartphone size={12}/>
                        </div>
                     )}
                  </div>

                  {/* Info */}
                  <div className="flex justify-between items-center mb-5 px-1">
                     <div className="flex items-center gap-2 text-gray-500">
                        <LinkIcon size={12} className="text-[#D4AF37]"/>
                        <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-[150px] text-gray-400">{slide.link || 'No Link'}</span>
                     </div>
                     <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                        {new Date(slide.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                     </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => openEdit(slide)}
                       className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-2"
                     >
                        <Edit3 size={12} /> Edit
                     </button>
                     <button 
                       onClick={() => handleDelete(slide._id)}
                       className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                     >
                        <Trash2 size={12} /> Delete
                     </button>
                  </div>

                </div>
              ))}
            </div>
        )}

      </div>
    </div>
  );
}