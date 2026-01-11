'use client';

import { createCategory, deleteCategory } from '@/app/actions';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Folder, ImageIcon, X, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

// --- SUB-COMPONENT: CREATE MODAL ---
const CategoryModal = ({ parent, onClose, onCreate }) => {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    await onCreate(formData);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-[#faf9f6] px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bodoni text-2xl text-black">
              {parent ? 'New Sub-Category' : 'New Root Category'}
            </h3>
            {parent && (
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Inside:</span>
                 <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">{parent.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-black shadow-sm transition-colors border border-gray-100">
            <X size={18}/>
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="parentId" value={parent ? parent._id : ''} />
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Name</label>
              <input 
                name="name" 
                placeholder={parent ? `e.g. ${parent.name} Accessories` : "e.g. Summer Collection"} 
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-lg font-medium outline-none transition-all placeholder:text-gray-300"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thumbnail Image</label>
              <div className="relative border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-6 hover:border-[#D4AF37] hover:bg-white transition-all text-center cursor-pointer group">
                <input type="file" name="image" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 group-hover:text-[#D4AF37] transition-colors">
                   <ImageIcon size={20}/>
                </div>
                <span className="text-xs text-gray-400 font-bold group-hover:text-gray-600 block">Click to upload</span>
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-black text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : (parent ? 'Add Sub-Category' : 'Create Category')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CategoryClient({ categories }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null); // null = root
  const containerRef = useRef(null);

  // Animation on Load
  useEffect(() => {
    if (containerRef.current) {
        gsap.fromTo(".anim-node", 
            { opacity: 0, y: 15 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }
  }, [categories]);

  const openCreateModal = (parent = null) => {
    setSelectedParent(parent);
    setModalOpen(true);
  };

  // --- RECURSIVE NODE RENDERER ---
  const CategoryNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div className="anim-node relative">
        {/* Visual Connector Lines for Tree */}
        {depth > 0 && (
           <>
             {/* Vertical Line from parent */}
             <div className="absolute top-[-10px] bottom-1/2 border-l-2 border-[#eaeaea]" style={{ left: '-24px' }}></div>
             {/* Horizontal curve to item */}
             <div className="absolute top-1/2 w-6 border-t-2 border-[#eaeaea]" style={{ left: '-24px' }}></div>
           </>
        )}

        {/* Card Item */}
        <div className={`
           group flex items-center justify-between p-4 mb-3 rounded-2xl border border-transparent 
           transition-all duration-300 hover:shadow-md
           ${depth === 0 ? 'bg-white shadow-sm border-gray-100' : 'bg-white/60 hover:bg-white border-dashed border-gray-200 hover:border-solid hover:border-gray-200'}
        `}>
           <div className="flex items-center gap-4">
              {/* Icon / Image */}
              <div className={`
                 w-12 h-12 rounded-xl flex items-center justify-center text-gray-300 transition-colors
                 ${node.image ? 'bg-gray-100 overflow-hidden' : 'bg-[#faf9f6] border border-gray-100 group-hover:border-[#D4AF37]/30'}
              `}>
                 {node.image ? (
                   <img src={node.image} alt={node.name} className="w-full h-full object-cover"/>
                 ) : (
                   <Folder size={20} className="group-hover:text-[#D4AF37] transition-colors"/>
                 )}
              </div>
              
              {/* Text Info */}
              <div>
                 <h4 className={`font-bodoni font-bold leading-tight ${depth === 0 ? 'text-lg text-gray-900' : 'text-base text-gray-700'}`}>
                    {node.name}
                 </h4>
                 <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wide">/{node.slug}</p>
              </div>
           </div>

           {/* Actions (Visible on Hover) */}
           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <button 
                onClick={() => openCreateModal(node)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:bg-[#D4AF37] transition-colors shadow-md"
                title="Add Sub-Category"
              >
                 <Plus size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Add Sub</span>
              </button>
              
              <button 
                onClick={() => { if(confirm(`Delete ${node.name} and all its sub-categories?`)) deleteCategory(node._id); }}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                title="Delete Category"
              >
                 <Trash2 size={14} />
              </button>
           </div>
        </div>

        {/* Recursive Children */}
        {hasChildren && (
           <div className="pl-12 ml-6 border-l-2 border-dashed border-[#eaeaea]">
              {node.children.map(child => (
                 <CategoryNode key={child._id} node={child} depth={depth + 1} />
              ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope p-8 pt-24 lg:pt-8" ref={containerRef}>
      
      {/* Modal Layer */}
      <AnimatePresence>
        {modalOpen && (
          <CategoryModal 
            parent={selectedParent} 
            onClose={() => setModalOpen(false)} 
            onCreate={createCategory}
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Organization</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Categories</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage your store hierarchy efficiently.</p>
          </div>
          <button 
            onClick={() => openCreateModal(null)} 
            className="mt-4 md:mt-0 bg-black text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Root Category
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
           {categories.length > 0 ? (
              categories.map(cat => <CategoryNode key={cat._id} node={cat} />)
           ) : (
              <div className="py-32 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-3xl">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Layers size={32} className="opacity-20 text-black" />
                 </div>
                 <p className="text-sm font-bold uppercase tracking-widest">No categories yet</p>
                 <p className="text-xs mt-1">Start by creating a root category above.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}