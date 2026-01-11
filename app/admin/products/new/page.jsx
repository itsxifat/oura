'use client';

import { createProduct, getCategories, getTags } from '@/app/actions';
import { getSizesData } from '@/actions/sizes'; // IMPORT NEW ACTION
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, Save, ArrowLeft, X, Check, Image as ImageIcon, Box, Tag, AlertCircle, ChevronDown, Barcode, Percent, Ruler } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import StockVariantManager from '../../components/StockVariantManager'; // IMPORT COMPONENT

const flattenCategories = (categories, depth = 0) => {
  let flat = [];
  categories.forEach(cat => {
    flat.push({ _id: cat._id, name: cat.name, depth: depth, label: `${'\u00A0\u00A0'.repeat(depth * 2)}${depth > 0 ? '└─ ' : ''}${cat.name}` });
    if (cat.children?.length > 0) flat = flat.concat(flattenCategories(cat.children, depth + 1));
  });
  return flat;
};

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className={`fixed bottom-8 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md min-w-[320px] ${type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : 'bg-green-50/90 border-green-200 text-green-800'}`}>
    {type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
    <div className="flex-1"><p className="text-xs font-bold uppercase tracking-widest opacity-70">{type === 'error' ? 'Error' : 'Success'}</p><p className="text-sm font-medium">{message}</p></div>
    <button onClick={onClose} className="opacity-50 hover:opacity-100"><X size={16}/></button>
  </motion.div>
);

export default function NewProductPage() {
  const router = useRouter();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [flatCategories, setFlatCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null); 
  const [autoGenSKU, setAutoGenSKU] = useState(false);
  const [autoGenBarcode, setAutoGenBarcode] = useState(false);

  // --- NEW STATE FOR SIZES ---
  const [sizeGuides, setSizeGuides] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);
  const [variants, setVariants] = useState([]); // Stores [{size: 'M', stock: 10}, ...]

  useEffect(() => {
    async function init() {
      const catTree = await getCategories();
      setFlatCategories(flattenCategories(catTree));
      
      const tags = await getTags();
      setAvailableTags(tags);

      // Fetch Size Data
      const sizeData = await getSizesData();
      if(sizeData.success) {
        setSizeGuides(sizeData.guides);
        setMasterSizes(sizeData.masterSizes);
      }
    }
    init();
    gsap.fromTo(".anim-entry", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" });
  }, []);

  const showToast = (message, type = 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };
  const handleImageChange = (e) => { if (e.target.files) setImages(prev => [...prev, ...Array.from(e.target.files)]); };
  const removeImage = (index) => { setImages(prev => prev.filter((_, i) => i !== index)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    formData.delete('images');
    images.forEach(file => formData.append('images', file));

    if(autoGenSKU) formData.set('sku', 'AUTO');
    if(autoGenBarcode) formData.set('barcode', 'AUTO');

    // --- APPEND VARIANTS AS JSON STRING ---
    // The server action 'createProduct' needs to parse this: JSON.parse(formData.get('variants'))
    formData.append('variants', JSON.stringify(variants));

    try {
        const res = await createProduct(formData);
        if (res.success) {
          showToast("Product published!", 'success');
          setTimeout(() => router.push('/admin/products'), 1000);
        } else {
          showToast(res.error || "Failed.", 'error');
          setLoading(false);
        }
    } catch (err) { showToast("Error occurred.", 'error'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope pb-32 text-black" ref={formRef}>
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black"><ArrowLeft size={20} /></Link>
            <div><h1 className="text-xl font-bodoni text-black">New Product</h1><p className="text-[10px] uppercase tracking-widest text-gray-400">Inventory Management</p></div>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition">Cancel</button>
             <button onClick={(e) => formRef.current?.requestSubmit()} disabled={loading} className="md:hidden bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">{loading ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />}</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* General */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4"><Tag size={18} className="text-[#D4AF37]"/><h3 className="font-bodoni text-lg text-black">Details</h3></div>
              <div className="space-y-6">
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Name</label><input name="name" required className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-lg font-medium outline-none transition-all" placeholder="e.g. Midnight Velvet" /></div>
                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label><textarea name="description" required rows="6" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-sm outline-none resize-none" placeholder="Product details..." /></div>
              </div>
            </div>

            {/* Visuals */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4"><ImageIcon size={18} className="text-[#D4AF37]"/><h3 className="font-bodoni text-lg text-black">Gallery</h3></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-square relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:border-[#D4AF37]">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <UploadCloud size={24} className="text-gray-400 mb-2"/>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Upload</span>
                </div>
                {images.map((file, i) => (
                  <div key={i} className="aspect-square relative rounded-2xl overflow-hidden shadow-sm"><img src={URL.createObjectURL(file)} className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-500"><X size={14}/></button></div>
                ))}
              </div>
            </div>

            {/* Inventory & Identifiers */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4"><Barcode size={18} className="text-[#D4AF37]"/><h3 className="font-bodoni text-lg text-black">Inventory Identifiers</h3></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                       SKU <span className="text-[#D4AF37] cursor-pointer hover:underline" onClick={() => setAutoGenSKU(!autoGenSKU)}>{autoGenSKU ? '(Auto-Generated)' : 'Generate?'}</span>
                     </label>
                     <input name="sku" disabled={autoGenSKU} className={`w-full p-4 rounded-xl text-sm font-mono font-bold outline-none border ${autoGenSKU ? 'bg-gray-100 border-transparent text-gray-400' : 'bg-gray-50 border-transparent focus:bg-white focus:border-[#D4AF37]'}`} placeholder={autoGenSKU ? "Generated on save" : "Enter custom SKU"} />
                 </div>
                 <div>
                     <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                       Barcode <span className="text-[#D4AF37] cursor-pointer hover:underline" onClick={() => setAutoGenBarcode(!autoGenBarcode)}>{autoGenBarcode ? '(Auto-Generated)' : 'Generate?'}</span>
                     </label>
                     <input name="barcode" disabled={autoGenBarcode} className={`w-full p-4 rounded-xl text-sm font-mono font-bold outline-none border ${autoGenBarcode ? 'bg-gray-100 border-transparent text-gray-400' : 'bg-gray-50 border-transparent focus:bg-white focus:border-[#D4AF37]'}`} placeholder={autoGenBarcode ? "Generated on save" : "Enter Barcode"} />
                 </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Organization */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bodoni text-lg text-black mb-6">Organization</h3>
              <div className="space-y-6">
                
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <div className="relative">
                    <select name="category" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer" defaultValue="">
                      <option value="" disabled>Select Category</option>
                      {flatCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
                  </div>
                </div>

                {/* Size Guide Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Size Chart</label>
                  <div className="relative">
                    <select name="sizeGuide" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer" defaultValue="">
                      <option value="">No Size Guide</option>
                      {sizeGuides.map(guide => <option key={guide._id} value={guide._id}>{guide.name}</option>)}
                    </select>
                    <Ruler size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
                  </div>
                </div>

                {/* Stock Variants */}
                <div>
                   <StockVariantManager 
                      masterSizes={masterSizes} 
                      value={variants} 
                      onChange={setVariants} 
                   />
                </div>

                {/* Tags */}
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</label>
                   <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                         <label key={tag._id} className="cursor-pointer">
                            <input type="checkbox" name="tags" value={tag._id} className="peer sr-only"/>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 peer-checked:bg-[#D4AF37] peer-checked:text-white transition-all select-none border border-transparent peer-checked:border-[#D4AF37]">{tag.name}</span>
                         </label>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Special Offer Engine */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/10 rounded-bl-full -mr-8 -mt-8"></div>
               <div className="flex items-center gap-3 mb-6">
                  <Percent size={18} className="text-[#D4AF37]"/>
                  <h3 className="font-bodoni text-lg text-black">Pricing & Offer</h3>
               </div>
               
               <div className="space-y-5">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Regular Price</label>
                     <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">৳</span><input name="price" type="number" required className="w-full pl-8 p-3 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border focus:border-[#D4AF37] transition-all font-bold"/></div>
                  </div>
                  
                  <div className="p-4 bg-[#faf9f6] rounded-xl border border-dashed border-[#D4AF37]/30">
                     <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Special Offer (Optional)</label>
                     <div className="space-y-3">
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400">৳</span><input name="discountPrice" type="number" placeholder="Sale Price" className="w-full pl-8 p-3 bg-white rounded-lg text-red-600 font-bold outline-none border border-gray-200 focus:border-red-400"/></div>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1"><label className="text-[9px] text-gray-400 uppercase">Starts</label><input name="saleStartDate" type="date" className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none"/></div>
                           <div className="space-y-1"><label className="text-[9px] text-gray-400 uppercase">Ends</label><input name="saleEndDate" type="date" className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none"/></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="anim-entry sticky top-32">
              <button disabled={loading} className="w-full bg-black text-white py-5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] disabled:opacity-70 transition-all flex justify-center items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 group">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} className="group-hover:scale-110 transition-transform"/> PUBLISH PRODUCT</>}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}