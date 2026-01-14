'use client';

import { saveNavbarConfig } from '@/app/actions';
import { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2, CornerDownRight, Layers, Layout, ChevronRight, Loader2, Search, Menu as MenuIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

export default function NavbarClient({ categories, currentLinks }) {
  const [navbarLinks, setNavbarLinks] = useState(currentLinks);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Animation on Mount
  useEffect(() => {
    if (containerRef.current) {
        gsap.fromTo(".anim-entry", 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
        );
    }
  }, []);

  // Flatten tree for the "Picker"
  const flatCategories = [];
  const flatten = (cats, depth = 0) => {
    cats.forEach(c => {
      flatCategories.push({ ...c, depth });
      if (c.children) flatten(c.children, depth + 1);
    });
  };
  flatten(categories);

  // Filter Categories
  const filteredCategories = flatCategories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToNavbar = (categoryId) => {
    const findCat = (nodes, id) => {
      for (const node of nodes) {
        if (node._id === id) return node;
        if (node.children) {
          const found = findCat(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const cat = findCat(categories, categoryId);
    if (!cat) return;

    const mapToLink = (c) => ({
      label: c.name,
      href: `/category/${c.slug}`,
      children: c.children ? c.children.map(mapToLink) : []
    });

    setNavbarLinks([...navbarLinks, mapToLink(cat)]);
  };

  const removeLink = (index) => {
    setNavbarLinks(navbarLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveNavbarConfig(navbarLinks);
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope p-4 md:p-8 pt-24 lg:pt-8 text-gray-900" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-8 gap-6">
          <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.3em] text-[10px]">Site Layout</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Navigation</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Customize the main menu links shown to customers.</p>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full md:w-auto bg-[#800000] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl shadow-[#800000]/20 hover:-translate-y-0.5"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT: PICKER (Sticky on Desktop) --- */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
             <div className="anim-entry bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
                <div className="mb-4 pb-4 border-b border-gray-100">
                   <h3 className="font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2 text-gray-900">
                      <Layers size={14} className="text-[#800000]"/> Available Categories
                   </h3>
                   <div className="relative mt-3">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input 
                        type="text" 
                        placeholder="Filter..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-gray-50 rounded-xl text-xs outline-none focus:bg-white focus:border-[#800000] border border-transparent transition-all placeholder:text-gray-400"
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 custom-scrollbar">
                   {filteredCategories.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center">
                         <Layers size={32} className="mb-2 opacity-20"/>
                         <p className="text-[10px] uppercase font-bold">No matches found</p>
                      </div>
                   ) : (
                      filteredCategories.map(cat => (
                        <button 
                          key={cat._id}
                          onClick={() => addToNavbar(cat._id)}
                          className="w-full flex items-center justify-between p-2.5 mb-1 rounded-lg hover:bg-gray-50 group transition-all text-left border border-transparent hover:border-gray-100"
                          style={{ paddingLeft: `${cat.depth * 12 + 10}px` }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {cat.depth > 0 && <CornerDownRight size={10} className="text-gray-300 flex-shrink-0" />}
                            <span className={`text-xs truncate ${cat.depth === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                              {cat.name}
                            </span>
                          </div>
                          <Plus size={14} className="text-gray-300 group-hover:text-[#800000] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                        </button>
                      ))
                   )}
                </div>
             </div>
          </div>

          {/* --- RIGHT: PREVIEW EDITOR --- */}
          <div className="lg:col-span-8">
             <div className="anim-entry bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col overflow-hidden relative">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>

                {/* Editor Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-[#faf9f6]/80 backdrop-blur-sm z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#800000] text-white rounded-lg shadow-md"><Layout size={18}/></div>
                      <div>
                         <h2 className="font-bodoni text-xl text-black">Active Menu Structure</h2>
                         <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 font-bold">Live Preview</p>
                      </div>
                   </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 z-10">
                   {navbarLinks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <MenuIcon size={24} className="opacity-20 text-black"/>
                         </div>
                         <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Menu Empty</p>
                         <p className="text-xs mt-1 opacity-60">Select categories from the left panel to add them.</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <AnimatePresence>
                            {navbarLinks.map((link, i) => (
                               <motion.div 
                                 key={`${link.label}-${i}`}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.95 }}
                                 layout
                                 className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-[#800000]/30 transition-all bg-white group"
                               >
                                  {/* Parent Item */}
                                  <div className="p-4 flex items-center justify-between bg-white z-10 relative">
                                     <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 flex items-center justify-center border border-gray-200 font-mono">
                                           {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                           <span className="font-bodoni font-bold text-lg text-gray-900 block group-hover:text-[#800000] transition-colors">{link.label}</span>
                                           <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded tracking-wide border border-gray-100">{link.href}</span>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={() => removeLink(i)} 
                                       className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                       title="Remove Item"
                                     >
                                        <Trash2 size={16}/>
                                     </button>
                                  </div>

                                  {/* Children Tree Visualization */}
                                  {link.children && link.children.length > 0 && (
                                     <div className="bg-[#faf9f6]/50 p-4 pt-0 border-t border-gray-100">
                                        <div className="mt-4 pl-3 space-y-3 relative">
                                           {/* Vertical Guide Line */}
                                           <div className="absolute left-[19px] top-0 bottom-4 w-[1px] bg-gray-200"></div>

                                           {link.children.map((child, j) => (
                                              <div key={j} className="relative pl-8">
                                                 {/* Horizontal Guide Line */}
                                                 <div className="absolute left-[4px] top-[14px] w-4 h-[1px] bg-gray-200"></div>
                                                 
                                                 {/* Child Card */}
                                                 <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-2 relative group/child hover:border-[#800000]/20 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                       <span className="text-xs font-bold text-gray-700 group-hover/child:text-[#800000] transition-colors">{child.label}</span>
                                                       <ChevronRight size={10} className="text-gray-300"/>
                                                    </div>

                                                    {/* Grandchildren Chips */}
                                                    {child.children && child.children.length > 0 && (
                                                       <div className="flex flex-wrap gap-1.5 mt-1">
                                                          {child.children.map((grand, k) => (
                                                             <span key={k} className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                                                <div className="w-1 h-1 rounded-full bg-[#D4AF37]"></div>
                                                                {grand.label}
                                                             </span>
                                                          ))}
                                                       </div>
                                                    )}
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  )}
                               </motion.div>
                            ))}
                         </AnimatePresence>
                      </div>
                   )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}