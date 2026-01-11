'use client';

import { useState, useEffect } from 'react';
import { createCoupon, getProductHierarchy } from '@/app/actions';
import { Plus, X, CheckCircle, Loader2, ChevronDown, ChevronRight, Box, Layers } from 'lucide-react';

export default function CreateCouponForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for logic
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [hierarchy, setHierarchy] = useState([]);
  
  // Toggle State for the UI accordion
  const [expandedCats, setExpandedCats] = useState({}); 

  useEffect(() => {
    if (isOpen) {
      // Fetch hierarchy only when opening form
      getProductHierarchy().then(setHierarchy);
    }
  }, [isOpen]);

  const toggleCat = (id) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    // Append the checkbox boolean manually
    formData.set('isAutomatic', isAutomatic);
    await createCoupon(formData);
    setLoading(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="group flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg hover:shadow-xl">
        <Plus size={18} /> Create New Offer
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 relative font-manrope">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
        <h3 className="font-bodoni text-2xl text-black">Configure Offer</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* AUTOMATIC SWITCH */}
        <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 flex items-center justify-between">
           <div>
              <h4 className="text-sm font-bold text-black uppercase">Automatic Discount</h4>
              <p className="text-xs text-gray-500">Apply automatically if rules are met. No code needed.</p>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAutomatic} onChange={(e) => setIsAutomatic(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
           </label>
        </div>

        {/* BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {!isAutomatic && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Code</label>
                <input name="code" placeholder="e.g. SUMMER25" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
             </div>
           )}
           <div className={`space-y-2 ${isAutomatic ? 'md:col-span-2' : ''}`}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description (Shown to Customer)</label>
              <input name="description" placeholder="e.g. Buy 2 items get 10% off" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
           </div>
        </div>

        {/* VALUE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Type</label>
              <select name="discountType" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none">
                 <option value="percentage">Percentage (%)</option>
                 <option value="fixed">Fixed Amount (৳)</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Value</label>
              <input name="discountValue" type="number" placeholder="0" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Expiry Date</label>
              <input name="validUntil" type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
           </div>
        </div>

        {/* RULES */}
        <div className="border-t border-gray-100 pt-6">
           <h4 className="text-xs font-bold text-[#D4AF37] mb-4 uppercase tracking-widest">Triggers</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Min Spend (৳)</label>
                 <input name="minSpend" type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Min Quantity (Items)</label>
                 <input name="minQuantity" type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black focus:border-[#D4AF37] outline-none" />
              </div>
           </div>
        </div>

        {/* PRODUCT SELECTOR (NESTED) */}
        <div className="border-t border-gray-100 pt-6">
           <h4 className="text-xs font-bold text-[#D4AF37] mb-4 uppercase tracking-widest">Applicable Items (Optional)</h4>
           
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              {hierarchy.length === 0 ? (
                 <p className="text-xs text-gray-400 text-center py-4">Loading products...</p>
              ) : (
                 hierarchy.map((cat) => (
                    <div key={cat._id} className="mb-2">
                       {/* Category Header */}
                       <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => toggleCat(cat._id)}>
                          <div className="flex items-center gap-2">
                             {expandedCats[cat._id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                             <Layers size={14} className="text-gray-400"/>
                             <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                          </div>
                          <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                             Apply to All
                             <input type="checkbox" name="categories" value={cat._id} className="accent-black w-4 h-4" />
                          </label>
                       </div>

                       {/* Products List (Collapsible) */}
                       {expandedCats[cat._id] && (
                          <div className="pl-8 pr-2 py-2 space-y-1 border-l-2 border-gray-200 ml-3">
                             {cat.products.map(prod => (
                                <label key={prod._id} className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer group">
                                   <div className="flex items-center gap-2">
                                      <Box size={12} className="text-gray-300 group-hover:text-[#D4AF37]"/>
                                      <span className="text-xs text-gray-600">{prod.name}</span>
                                   </div>
                                   <div className="flex items-center gap-4">
                                      <span className="text-[10px] text-gray-400">৳{prod.price}</span>
                                      <input type="checkbox" name="products" value={prod._id} className="accent-black w-3.5 h-3.5" />
                                   </div>
                                </label>
                             ))}
                             {cat.products.length === 0 && <p className="text-[10px] text-gray-400 pl-6">No products found.</p>}
                          </div>
                       )}
                    </div>
                 ))
              )}
           </div>
           <p className="text-[10px] text-gray-400 mt-2">* If nothing selected, applies to entire cart.</p>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
           <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
           <button disabled={loading} className="bg-[#D4AF37] text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-md">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Create Rules'}
           </button>
        </div>

      </form>
    </div>
  );
}