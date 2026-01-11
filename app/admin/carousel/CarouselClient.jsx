'use client';

import { addSlide, updateSlide, deleteSlide } from '@/app/actions';
import { useRef, useState, useEffect } from 'react';
import { 
  Trash2, Loader2, Link as LinkIcon, 
  Smartphone, Monitor, Image as ImageIcon, 
  Plus, X, Edit2, CheckCircle2, XCircle
} from 'lucide-react';

// --- TOAST NOTIFICATION ---
const Toast = ({ notification, onClose }) => {
  if (!notification) return null;
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl border backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' : 'bg-red-900/90 border-red-700 text-red-100'}`}>
      {notification.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
      <div><h4 className="text-sm font-bold uppercase tracking-wider">{notification.title}</h4></div>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><XCircle size={14}/></button>
    </div>
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
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-8 pt-24 lg:pt-8">
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER (Matches Coupon Page) */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Visual Merchandising</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Hero Carousel</h1>
          </div>
          <div className="mt-4 md:mt-0 text-right">
             <p className="text-gray-500 text-sm">Manage homepage main visuals.</p>
          </div>
        </div>

        {/* CREATE BUTTON / FORM TOGGLE */}
        {!isFormOpen ? (
           <button onClick={openCreate} className="group flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg hover:shadow-xl mb-12">
             <Plus size={18} /> Add New Slide
           </button>
        ) : (
          <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 relative font-manrope mb-12">
             <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <h3 className="font-bodoni text-2xl text-black">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
             </div>

             <form ref={formRef} action={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Desktop Image */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                         <Monitor size={14}/> Desktop Image <span className="text-[#D4AF37]">*</span>
                      </label>
                      <div className="relative aspect-[16/9] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden group hover:border-[#D4AF37] transition-colors">
                         {(desktopPreview || editingSlide?.image) ? (
                            <img src={desktopPreview || editingSlide.image} className="w-full h-full object-cover" />
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                               <ImageIcon size={32}/>
                            </div>
                         )}
                         <input 
                           type="file" name="image" accept="image/*" 
                           onChange={(e) => handleImageChange(e, 'desktop')}
                           required={!editingSlide}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: 1920x1080px</p>
                   </div>

                   {/* Mobile Image */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                         <Smartphone size={14}/> Mobile Image (Optional)
                      </label>
                      <div className="relative aspect-[16/9] md:aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden group hover:border-[#D4AF37] transition-colors max-w-[200px]">
                         {(mobilePreview || editingSlide?.mobileImage) ? (
                            <img src={mobilePreview || editingSlide.mobileImage} className="w-full h-full object-cover" />
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                               <ImageIcon size={32}/>
                            </div>
                         )}
                         <input 
                           type="file" name="mobileImage" accept="image/*" 
                           onChange={(e) => handleImageChange(e, 'mobile')}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: 1080x1920px</p>
                   </div>
                </div>

                {/* Link */}
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Destination Link</label>
                   <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <LinkIcon size={16} className="text-gray-400"/>
                      <input 
                         name="link" 
                         defaultValue={editingSlide?.link || ''}
                         placeholder="/collections/winter" 
                         className="flex-1 bg-transparent outline-none text-sm"
                      />
                   </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                   <button type="button" onClick={closeForm} className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                   <button disabled={isSubmitting} className="bg-[#D4AF37] text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-md">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : (editingSlide ? 'Update Slide' : 'Publish Slide')}
                   </button>
                </div>
             </form>
          </div>
        )}

        {/* SLIDE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <div key={slide._id} className="group relative bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden">
              
              {/* Image Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4">
                 <img src={slide.image || '/placeholder.jpg'} alt="Slide" className="w-full h-full object-cover" />
                 
                 {/* Mobile Indicator Badge */}
                 {slide.mobileImage && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white p-1.5 rounded-md backdrop-blur-sm" title="Mobile Image Available">
                       <Smartphone size={12}/>
                    </div>
                 )}
              </div>

              {/* Info */}
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-gray-500">
                    <LinkIcon size={12}/>
                    <span className="text-xs font-mono truncate max-w-[150px]">{slide.link}</span>
                 </div>
                 <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                    {new Date(slide.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                 </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => openEdit(slide)}
                   className="py-2.5 rounded-lg border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-2"
                 >
                    <Edit2 size={12} /> Edit
                 </button>
                 <button 
                   onClick={() => handleDelete(slide._id)}
                   className="py-2.5 rounded-lg border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                 >
                    <Trash2 size={12} /> Delete
                 </button>
              </div>

            </div>
          ))}

          {slides.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-xl">
               <ImageIcon size={48} className="mx-auto text-gray-300 mb-4 opacity-50"/>
               <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No active slides</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}