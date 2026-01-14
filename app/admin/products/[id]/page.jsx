'use client';

import { updateProduct, getCategories, getTags, getProductById } from '@/app/actions';
import { getSizesData } from '@/actions/sizes'; 
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, UploadCloud, Save, ArrowLeft, X, Check, Image as ImageIcon, Box, Tag, AlertCircle, ChevronDown, Barcode, Percent, Ruler, Layers } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import StockVariantManager from '../../components/StockVariantManager'; 

// --- UTILITY: Prevent Input Scroll Change ---
const preventScroll = (e) => e.target.blur();

// --- UTILITY: High-Performance Image Compression (GPU Friendly) ---
const generateThumbnail = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/jpeg', 0.7); 
      };
    };
  });
};

// --- COMPONENT: New Image (Memoized + Compressed) ---
const ImagePreviewItem = memo(({ file, onRemove }) => {
  const [thumb, setThumb] = useState(null);
  useEffect(() => {
    let active = true;
    generateThumbnail(file).then(url => { if(active) setThumb(url); });
    return () => { active = false; };
  }, [file]);

  return (
    <div className="aspect-square relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 group bg-white hover:border-[#B91C1C] transition-colors">
      {!thumb ? <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#B91C1C]"/></div> 
      : <img src={thumb} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="New" loading="lazy" decoding="async" />}
      <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-[#B91C1C] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#B91C1C] hover:text-white shadow-md"><X size={14}/></button>
      <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-[#B91C1C] text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">NEW</span>
    </div>
  );
});
ImagePreviewItem.displayName = 'ImagePreviewItem';

// --- COMPONENT: Existing Image (Memoized) ---
const ExistingImageItem = memo(({ url, onRemove }) => (
  <div className="aspect-square relative rounded-2xl overflow-hidden shadow-sm group bg-gray-50 border border-gray-200 hover:border-[#B91C1C] transition-colors">
      <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Existing" loading="lazy" decoding="async" />
      <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-[#B91C1C] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#B91C1C] hover:text-white shadow-md"><X size={14}/></button>
  </div>
));
ExistingImageItem.displayName = 'ExistingImageItem';

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className={`fixed bottom-8 left-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md min-w-[340px] ${type === 'error' ? 'bg-red-50/95 border-red-200 text-[#B91C1C]' : 'bg-green-50/95 border-green-200 text-green-800'}`}>
    <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
       {type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
    </div>
    <div className="flex-1">
       <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{type === 'error' ? 'Error' : 'Success'}</p>
       <p className="text-sm font-bold">{message}</p>
    </div>
    <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity"><X size={18}/></button>
  </motion.div>
);

const flattenCategories = (categories, depth = 0) => {
  let flat = [];
  categories.forEach(cat => {
    flat.push({ _id: cat._id, name: cat.name, depth: depth, label: `${'\u00A0\u00A0'.repeat(depth * 3)}${depth > 0 ? '↳ ' : ''}${cat.name}` });
    if (cat.children?.length > 0) flat = flat.concat(flattenCategories(cat.children, depth + 1));
  });
  return flat;
};

// --- TAKA SVG ---
const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef(null);
  const dataFetchedRef = useRef(false);

  // State
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); 
  
  const [productData, setProductData] = useState(null);
  const [flatCategories, setFlatCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sizeGuides, setSizeGuides] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);

  // Complex Form State
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [variants, setVariants] = useState([]); 
  const [autoGenSKU, setAutoGenSKU] = useState(false);
  const [autoGenBarcode, setAutoGenBarcode] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    async function load() {
      try {
        const [catTree, tags, sizeData, product] = await Promise.all([
            getCategories(), getTags(), getSizesData(), getProductById(params.id)
        ]);

        setFlatCategories(flattenCategories(catTree));
        setAvailableTags(tags);
        if(sizeData.success) {
            setSizeGuides(sizeData.guides);
            setMasterSizes(sizeData.masterSizes);
        }

        if (product) {
            setProductData(product);
            setExistingImages(product.images || []);
            if (product.variants?.length > 0) {
                setVariants(product.variants);
            } else if (product.sizes?.length > 0) {
                const stockPerSize = Math.floor((product.stock || 0) / product.sizes.length);
                setVariants(product.sizes.map(s => ({ size: s, stock: stockPerSize })));
            }
        } else {
            router.push('/admin/products');
        }
      } catch (err) { console.error(err); } 
      finally { setInitLoading(false); }
    }
    load();
  }, [params.id]);

  // Animation
  useEffect(() => {
    if (!initLoading && formRef.current) gsap.fromTo(".anim-entry", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" });
  }, [initLoading]);

  // Handlers (Memoized)
  const showToast = useCallback((message, type = 'error') => { 
      setToast({ message, type }); setTimeout(() => setToast(null), 4000); 
  }, []);
  
  const handleNewImageChange = useCallback((e) => { 
      if (e.target.files?.length) setNewImages(prev => [...prev, ...Array.from(e.target.files)]); 
  }, []);
  
  const removeExistingImage = useCallback((index) => setExistingImages(prev => prev.filter((_, i) => i !== index)), []);
  const removeNewImage = useCallback((index) => setNewImages(prev => prev.filter((_, i) => i !== index)), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const formData = new FormData(e.target);
        formData.append('id', params.id);
        
        existingImages.forEach(url => formData.append('keptImages', url));
        newImages.forEach(file => formData.append('newImages', file));
        formData.delete('images'); 

        formData.append('variants', JSON.stringify(variants));

        if(autoGenSKU) formData.set('sku', 'AUTO');
        if(autoGenBarcode) formData.set('barcode', 'AUTO');

        const res = await updateProduct(formData);
        
        if (res.success) {
          showToast("Product updated successfully!", 'success');
          setTimeout(() => router.push('/admin/products'), 800);
        } else {
          showToast(res.error || "Update failed.", 'error');
          setSaving(false);
        }
    } catch (err) { 
        showToast("An unexpected error occurred.", 'error'); 
        setSaving(false); 
    }
  };

  if (initLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-[#B91C1C]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">Loading Product Data...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope pb-40 text-black">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* --- HEADER --- */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2.5 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-black"><ArrowLeft size={20} /></Link>
            <div>
               <h1 className="text-2xl font-bodoni text-black">Edit Product</h1>
               <p className="text-[10px] uppercase tracking-widest text-[#B91C1C] font-bold">Catalog Management</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition">Cancel</button>
             <button onClick={() => formRef.current?.requestSubmit()} disabled={saving} className="bg-[#B91C1C] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-70 transition-all shadow-lg shadow-[#B91C1C]/20">
               {saving ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />} Save Changes
             </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-7xl mx-auto p-8">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* DETAILS */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                 <Tag size={20} className="text-[#B91C1C]"/>
                 <h3 className="font-bodoni text-xl text-black">Basic Information</h3>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Product Name</label>
                   <input name="name" defaultValue={productData.name} required className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#B91C1C] rounded-xl text-lg font-medium transition-all outline-none placeholder:text-gray-300" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                   <textarea name="description" defaultValue={productData.description} required rows="6" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#B91C1C] rounded-xl text-sm outline-none resize-none placeholder:text-gray-300" />
                </div>
              </div>
            </div>

            {/* GALLERY */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                 <ImageIcon size={20} className="text-[#B91C1C]"/>
                 <h3 className="font-bodoni text-xl text-black">Visuals</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-square relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:border-[#B91C1C] hover:bg-red-50/10 transition-all">
                  <input type="file" multiple accept="image/*" onChange={handleNewImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <UploadCloud size={24} className="text-gray-400 mb-2 group-hover:text-[#B91C1C] transition-colors"/>
                  <span className="text-[10px] font-bold uppercase text-gray-400 group-hover:text-[#B91C1C]">Add New</span>
                </div>
                {/* Optimized Existing Images */}
                {existingImages.map((url, i) => (
                    <ExistingImageItem key={`ex-${i}`} url={url} onRemove={() => removeExistingImage(i)} />
                ))}
                {/* Optimized New Images */}
                {newImages.map((file, i) => (
                    <ImagePreviewItem key={`new-${i}-${file.name}`} file={file} onRemove={() => removeNewImage(i)} />
                ))}
              </div>
            </div>

            {/* INVENTORY */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
               <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                  <Barcode size={20} className="text-[#B91C1C]"/>
                  <h3 className="font-bodoni text-xl text-black">Inventory Codes</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                     <label className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                       SKU <button type="button" className="text-[#B91C1C] hover:underline" onClick={() => setAutoGenSKU(!autoGenSKU)}>{autoGenSKU ? '(Will Regenerate)' : 'Regenerate?'}</button>
                     </label>
                     <div className={`relative rounded-xl border transition-colors ${autoGenSKU ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 focus-within:border-[#B91C1C]'}`}>
                        <input name="sku" defaultValue={productData.sku} disabled={autoGenSKU} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-gray-800 disabled:text-gray-400" placeholder={autoGenSKU ? "Auto-Generating..." : "Custom SKU"} />
                        {autoGenSKU && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B91C1C]"><Check size={16}/></div>}
                     </div>
                 </div>
                 <div>
                     <label className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                       Barcode <button type="button" className="text-[#B91C1C] hover:underline" onClick={() => setAutoGenBarcode(!autoGenBarcode)}>{autoGenBarcode ? '(Will Regenerate)' : 'Regenerate?'}</button>
                     </label>
                     <div className={`relative rounded-xl border transition-colors ${autoGenBarcode ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 focus-within:border-[#B91C1C]'}`}>
                        <input name="barcode" defaultValue={productData.barcode} disabled={autoGenBarcode} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-gray-800 disabled:text-gray-400" placeholder={autoGenBarcode ? "Auto-Generating..." : "Custom Barcode"} />
                        {autoGenBarcode && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B91C1C]"><Check size={16}/></div>}
                     </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bodoni text-xl text-black mb-6">Organization</h3>
              <div className="space-y-6">
                
                {/* Category */}
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-[#B91C1C] transition-colors">Category</label>
                  <div className="relative">
                    <select name="category" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#B91C1C] rounded-xl text-sm font-bold outline-none appearance-none cursor-pointer text-gray-800" defaultValue={productData.category?._id || productData.category}>
                      <option value="" disabled>Select Category</option>
                      {flatCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
                  </div>
                </div>

                {/* Size Guide */}
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-[#B91C1C] transition-colors">Size Chart</label>
                  <div className="relative">
                    <select name="sizeGuide" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#B91C1C] rounded-xl text-sm font-bold outline-none appearance-none cursor-pointer text-gray-800" defaultValue={productData.sizeGuide?._id || productData.sizeGuide || ""}>
                      <option value="">No Size Guide</option>
                      {sizeGuides.map(guide => <option key={guide._id} value={guide._id}>{guide.name}</option>)}
                    </select>
                    <Ruler size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
                  </div>
                </div>

                <div>
                   <StockVariantManager 
                      masterSizes={masterSizes} 
                      value={variants} 
                      onChange={setVariants} 
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</label>
                   <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                         <label key={tag._id} className="cursor-pointer group">
                            <input type="checkbox" name="tags" value={tag._id} defaultChecked={productData.tags?.some(t => t._id === tag._id || t === tag._id)} className="peer sr-only"/>
                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-200 peer-checked:bg-[#B91C1C] peer-checked:text-white peer-checked:border-[#B91C1C] transition-all select-none block group-hover:border-gray-300">
                               {tag.name}
                            </span>
                         </label>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Pricing Engine */}
            <div className="anim-entry bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#B91C1C]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-yellow-50 rounded-lg text-[#D4AF37]">
                     <Percent size={20} />
                  </div>
                  <h3 className="font-bodoni text-xl text-black">Pricing</h3>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Regular Price</label>
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors"><Taka/></span>
                        <input name="price" type="number" onWheel={preventScroll} defaultValue={productData.price} required className="w-full pl-10 p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#B91C1C] rounded-xl text-lg font-bold outline-none transition-all text-black"/>
                     </div>
                  </div>
                  
                  <div className="p-5 bg-[#FAFAFA] rounded-xl border border-dashed border-[#D4AF37]/40 relative">
                     <div className="absolute -top-3 left-4 bg-[#FAFAFA] px-2 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Special Offer</div>
                     
                     <div className="space-y-4 pt-2">
                        <div className="relative group">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400"><Taka/></span>
                           <input name="discountPrice" type="number" onWheel={preventScroll} defaultValue={productData.discountPrice} placeholder="Sale Price" className="w-full pl-10 p-3 bg-white rounded-lg text-red-600 font-bold outline-none border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[9px] text-gray-400 uppercase font-bold ml-1">Starts</label>
                              <input name="saleStartDate" type="date" defaultValue={productData.saleStartDate ? new Date(productData.saleStartDate).toISOString().split('T')[0] : ''} className="w-full p-2.5 text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#D4AF37]"/>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] text-gray-400 uppercase font-bold ml-1">Ends</label>
                              <input name="saleEndDate" type="date" defaultValue={productData.saleEndDate ? new Date(productData.saleEndDate).toISOString().split('T')[0] : ''} className="w-full p-2.5 text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#D4AF37]"/>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}