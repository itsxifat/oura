'use client';

import { useState, useEffect } from 'react';
import { createCoupon, getProductHierarchy } from '@/app/actions';
import { Plus, X, CheckCircle, Loader2, ChevronDown, ChevronRight, Box, Layers, Tag, Percent, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <button onClick={() => setIsOpen(true)} className="group flex items-center gap-3 bg-[#800000] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl shadow-[#800000]/20">
        <Plus size={16} /> Create New Offer
      </button>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative font-manrope overflow-hidden"
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#800000]/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6 relative z-10">
        <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.2em] text-[10px] block mb-1">New Campaign</span>
            <h3 className="font-bodoni text-2xl text-black">Configure Offer</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20}/></button>
      </div>

      <form action={handleSubmit} className="space-y-8 relative z-10">
        
        {/* AUTOMATIC SWITCH */}
        <div className={`p-5 rounded-xl border flex items-center justify-between transition-colors ${isAutomatic ? 'bg-[#800000]/5 border-[#800000]/20' : 'bg-gray-50 border-gray-200'}`}>
           <div>
              <h4 className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${isAutomatic ? 'text-[#800000]' : 'text-gray-700'}`}>
                  {isAutomatic ? <CheckCircle size={16}/> : <Tag size={16}/>}
                  Automatic Discount
              </h4>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">Apply automatically if rules are met. No code needed.</p>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAutomatic} onChange={(e) => setIsAutomatic(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#800000]"></div>
           </label>
        </div>

        {/* BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {!isAutomatic && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#800000]">Code</label>
                <input name="code" placeholder="e.g. SUMMER25" required className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-black focus:border-[#800000] outline-none placeholder:font-normal placeholder:text-gray-300" />
             </div>
           )}
           <div className={`space-y-2 ${isAutomatic ? 'md:col-span-2' : ''}`}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#800000]">Description (Public)</label>
              <input name="description" placeholder="e.g. Buy 2 items get 10% off" required className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-black focus:border-[#800000] outline-none placeholder:font-normal placeholder:text-gray-300" />
           </div>
        </div>

        {/* VALUE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</label>
              <div className="relative">
                  <select name="discountType" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-700 focus:border-[#800000] outline-none appearance-none cursor-pointer">
                     <option value="percentage">Percentage (%)</option>
                     <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Value</label>
              <input name="discountValue" type="number" placeholder="0" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-black focus:border-[#800000] outline-none" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expiry Date</label>
              <input name="validUntil" type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-700 focus:border-[#800000] outline-none cursor-pointer" />
           </div>
        </div>

        {/* RULES */}
        <div className="border-t border-gray-100 pt-8">
           <h4 className="text-xs font-bold text-black mb-6 uppercase tracking-widest flex items-center gap-2"><Layers size={14} className="text-[#800000]"/> Triggers & Limits</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Min Spend (৳)</label>
                 <input name="minSpend" type="number" placeholder="0" className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-black focus:border-[#800000] outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Min Quantity (Items)</label>
                 <input name="minQuantity" type="number" placeholder="0" className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-black focus:border-[#800000] outline-none" />
              </div>
           </div>
        </div>

        {/* PRODUCT SELECTOR (NESTED) */}
        <div className="border-t border-gray-100 pt-8">
           <h4 className="text-xs font-bold text-black mb-6 uppercase tracking-widest flex items-center gap-2"><Box size={14} className="text-[#800000]"/> Applicable Items (Optional)</h4>
           
           <div className="bg-[#faf9f6] border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
              {hierarchy.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Loader2 size={24} className="animate-spin mb-2"/>
                    <p className="text-[10px] font-bold uppercase">Loading products...</p>
                 </div>
              ) : (
                 hierarchy.map((cat) => (
                    <div key={cat._id} className="mb-2">
                       {/* Category Header */}
                       <div className="flex items-center justify-between p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100 hover:shadow-sm" onClick={() => toggleCat(cat._id)}>
                          <div className="flex items-center gap-3">
                             {expandedCats[cat._id] ? <ChevronDown size={14} className="text-[#800000]"/> : <ChevronRight size={14} className="text-gray-400"/>}
                             <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                          </div>
                          <label className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-400 cursor-pointer hover:text-[#800000]" onClick={(e) => e.stopPropagation()}>
                             Apply to All
                             <input type="checkbox" name="categories" value={cat._id} className="accent-[#800000] w-4 h-4 rounded border-gray-300" />
                          </label>
                       </div>

                       {/* Products List (Collapsible) */}
                       <AnimatePresence>
                           {expandedCats[cat._id] && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-9 pr-2 py-2 space-y-1 border-l-2 border-gray-200 ml-4 overflow-hidden"
                              >
                                 {cat.products.map(prod => (
                                    <label key={prod._id} className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer group transition-colors">
                                       <span className="text-xs text-gray-600 font-medium group-hover:text-black">{prod.name}</span>
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] text-gray-400 font-mono">৳{prod.price}</span>
                                          <input type="checkbox" name="products" value={prod._id} className="accent-[#800000] w-3.5 h-3.5 rounded" />
                                       </div>
                                    </label>
                                 ))}
                                 {cat.products.length === 0 && <p className="text-[10px] text-gray-400 pl-2 italic">No products in this category.</p>}
                              </motion.div>
                           )}
                       </AnimatePresence>
                    </div>
                 ))
              )}
           </div>
           <p className="text-[10px] text-gray-400 mt-3 font-medium">* If nothing is selected, the rule applies to the entire cart.</p>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
           <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
           <button disabled={loading} className="bg-[#800000] text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-[#800000]/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Publish Offer'}
           </button>
        </div>

      </form>
    </motion.div>
  );
}