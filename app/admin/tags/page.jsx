'use client';

import { useState, useEffect, useRef } from 'react';
import { getTags, createTag, deleteTag, getProductsByTag } from '@/app/actions';
import { Tag as TagIcon, Plus, Trash2, Package, Loader2, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

export default function TagsPage() {
  const containerRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsInTag, setProductsInTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Create State
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#D4AF37'); // Default Gold
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  // Animate Entry
  useEffect(() => {
    if (!loading && containerRef.current) {
        gsap.fromTo(".anim-entry", 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
        );
    }
  }, [loading, tags]);

  async function loadTags() {
    const data = await getTags();
    setTags(data);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if(!newTagName) return;
    setCreating(true);
    const formData = new FormData();
    formData.append('name', newTagName);
    formData.append('color', newTagColor);
    await createTag(formData);
    setNewTagName('');
    await loadTags();
    setCreating(false);
  }

  async function handleDelete(id) {
    if(!confirm("Delete this tag? Products will not be deleted, just untagged.")) return;
    await deleteTag(id);
    await loadTags();
    if(selectedTag?._id === id) setSelectedTag(null);
  }

  async function handleSelectTag(tag) {
    setSelectedTag(tag);
    setProductsInTag([]); // Reset while loading
    const prods = await getProductsByTag(tag._id);
    setProductsInTag(prods);
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-8 pt-24 lg:pt-8" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Organization</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Product Tags</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage labels for grouping products (e.g., Sale, New Arrival).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: TAG LIST & CREATE (4 Columns) */}
          <div className="lg:col-span-4 space-y-8">
             
             {/* Create Form */}
             <div className="anim-entry bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
                
                <h3 className="font-bold text-xs uppercase tracking-widest mb-6 text-gray-900 flex items-center gap-2">
                   <Plus size={14} className="text-[#D4AF37]"/> Create New Tag
                </h3>
                
                <form onSubmit={handleCreate} className="space-y-5">
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tag Name</label>
                      <input 
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:border-[#D4AF37] transition-all placeholder:text-gray-300"
                        placeholder="e.g. Summer Sale"
                      />
                   </div>
                   
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Badge Color</label>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                         <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <input 
                              type="color" 
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-0 p-0 m-0"
                            />
                         </div>
                         <span className="text-xs font-mono text-gray-500 uppercase">{newTagColor}</span>
                      </div>
                   </div>

                   <button 
                     disabled={creating} 
                     className="w-full bg-black text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg group"
                   >
                      {creating ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14} className="group-hover:rotate-90 transition-transform"/>} 
                      {creating ? 'Creating...' : 'Create Tag'}
                   </button>
                </form>
             </div>

             {/* Tag List */}
             <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 px-2">Active Tags</h3>
                {tags.length === 0 && (
                   <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      <TagIcon size={24} className="mx-auto mb-2 opacity-20"/>
                      <span className="text-[10px] uppercase">No tags found</span>
                   </div>
                )}
                {tags.map(tag => (
                   <motion.div 
                     layoutId={tag._id}
                     key={tag._id} 
                     onClick={() => handleSelectTag(tag)}
                     className={`anim-entry group relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border 
                        ${selectedTag?._id === tag._id 
                           ? 'bg-white border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/20 z-10' 
                           : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                        }`}
                   >
                      <div className="flex items-center gap-4">
                         <div 
                           className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ring-2 ring-white" 
                           style={{ backgroundColor: tag.color }}
                         ></div>
                         <span className={`font-bold text-sm transition-colors ${selectedTag?._id === tag._id ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>
                            {tag.name}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {selectedTag?._id === tag._id && (
                            <motion.span initial={{scale:0}} animate={{scale:1}} className="text-[#D4AF37]">
                               <ArrowRight size={14}/>
                            </motion.span>
                         )}
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDelete(tag._id); }}
                           className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                           title="Delete Tag"
                         >
                            <Trash2 size={14}/>
                         </button>
                      </div>
                   </motion.div>
                ))}
             </div>
          </div>

          {/* RIGHT: PRODUCTS IN TAG (8 Columns) */}
          <div className="lg:col-span-8">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col h-full overflow-hidden relative">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>

                {selectedTag ? (
                   <motion.div 
                     initial={{opacity:0}} animate={{opacity:1}} 
                     className="flex-1 flex flex-col relative z-10"
                   >
                      {/* Tag Header */}
                      <div className="p-8 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-6 h-6 rounded-full shadow-lg ring-4 ring-white" style={{ backgroundColor: selectedTag.color }}></div>
                               <div>
                                  <h2 className="font-bodoni text-3xl text-black leading-none">{selectedTag.name}</h2>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Tag Overview</p>
                               </div>
                            </div>
                            <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg">
                               {productsInTag.length} Products
                            </div>
                         </div>
                      </div>

                      {/* Product Grid */}
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 content-start overflow-y-auto max-h-[800px] scrollbar-thin scrollbar-thumb-gray-200">
                         <AnimatePresence mode="popLayout">
                           {productsInTag.map((prod, i) => (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={prod._id} 
                                className="group flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-300"
                              >
                                 <div className="w-14 h-18 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-inner">
                                    <img src={prod.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-[#D4AF37] transition-colors">{prod.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{prod.sku || 'NO SKU'}</p>
                                    <span className="block font-bold text-xs mt-1">৳{prod.price?.toLocaleString()}</span>
                                 </div>
                              </motion.div>
                           ))}
                         </AnimatePresence>

                         {productsInTag.length === 0 && (
                            <div className="col-span-full py-32 text-center flex flex-col items-center justify-center text-gray-400">
                               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                  <Package size={24} className="opacity-30"/>
                               </div>
                               <p className="text-xs uppercase tracking-widest font-bold">No products tagged yet</p>
                               <p className="text-[10px] mt-1">Go to Products page to assign this tag.</p>
                            </div>
                         )}
                      </div>
                   </motion.div>
                ) : (
                   /* Empty Selection State */
                   <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8 text-center relative z-10">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                         <TagIcon size={40} className="opacity-20 text-gray-400"/>
                      </div>
                      <h3 className="text-lg font-bodoni text-gray-400 mb-2">No Tag Selected</h3>
                      <p className="text-xs uppercase tracking-widest font-bold opacity-60">Select a tag from the left to view products</p>
                   </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}