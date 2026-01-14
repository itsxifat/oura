'use client';

import { createCategory, deleteCategory } from '@/app/actions';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Folder, ImageIcon, X, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

// --- SUB-COMPONENT: CREATE MODAL ---
const CategoryModal = ({ parent, onClose, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleSubmit(formData) {
    setLoading(true);
    await onCreate(formData);
    setLoading(false);
    onClose();
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Modal Header */}
        <div className="bg-[#faf9f6] px-8 py-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-bodoni text-2xl text-black">
              {parent ? 'New Sub-Category' : 'New Root Category'}
            </h3>
            {parent && (
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Inside:</span>
                 <span className="text-xs font-bold text-[#800000] bg-[#800000]/5 border border-[#800000]/10 px-2 py-0.5 rounded">{parent.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-black shadow-sm transition-colors border border-gray-100 hover:border-gray-300">
            <X size={18}/>
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="parentId" value={parent ? parent._id : ''} />
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#800000] uppercase tracking-widest">Category Name</label>
              <input 
                name="name" 
                placeholder={parent ? `e.g. ${parent.name} Accessories` : "e.g. Summer Collection"} 
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#800000] rounded-xl text-lg font-medium outline-none transition-all placeholder:text-gray-300"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#800000] uppercase tracking-widest">Thumbnail Image (4:5 Ratio)</label>
              
              {/* UPDATED CONTAINER: 
                  - Removed 'w-full'
                  - Added 'w-32 md:w-40' for responsive small size
                  - Added 'mx-auto' to center it
              */}
              <div className="relative aspect-[4/5] w-32 md:w-40 mx-auto border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl overflow-hidden hover:border-[#800000] hover:bg-white transition-all text-center cursor-pointer group flex flex-col items-center justify-center">
                
                <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />

                {preview ? (
                    <img 
                        src={preview} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                    />
                ) : (
                    <>
                        <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 group-hover:text-[#800000] transition-colors relative z-0">
                           <ImageIcon size={20}/>
                        </div>
                        <span className="text-xs text-gray-400 font-bold group-hover:text-gray-600 block relative z-0">Click to upload</span>
                    </>
                )}
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-[#800000] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#800000]/20 hover:shadow-xl disabled:opacity-70"
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
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out", force3D: true }
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
      <div className="anim-node relative will-change-transform backface-hidden">
        {depth > 0 && (
           <>
             <div className="absolute top-[-10px] bottom-1/2 border-l border-[#dcdcdc]" style={{ left: '-24px' }}></div>
             <div className="absolute top-1/2 w-6 border-t border-[#dcdcdc]" style={{ left: '-24px' }}></div>
           </>
        )}

        <div className={`
           group flex items-center justify-between p-4 mb-3 rounded-xl border transition-all duration-300
           ${depth === 0 
             ? 'bg-white shadow-sm border-gray-200 hover:border-[#800000]/30 hover:shadow-md' 
             : 'bg-white/50 hover:bg-white border-dashed border-gray-300 hover:border-solid hover:border-[#800000]/30'
           }
        `}>
           <div className="flex items-center gap-4">
              <div className={`
                 w-12 h-12 rounded-lg flex items-center justify-center transition-colors border
                 ${node.image ? 'bg-gray-100 border-gray-200 overflow-hidden' : 'bg-[#faf9f6] border-gray-200 group-hover:border-[#800000]'}
              `}>
                 {node.image ? (
                   <img src={node.image} alt={node.name} className="w-full h-full object-cover"/>
                 ) : (
                   <Folder size={20} className="text-gray-300 group-hover:text-[#800000] transition-colors"/>
                 )}
              </div>
              
              <div>
                 <h4 className={`font-bodoni font-bold leading-tight group-hover:text-[#800000] transition-colors ${depth === 0 ? 'text-lg text-gray-900' : 'text-base text-gray-700'}`}>
                    {node.name}
                 </h4>
                 <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wide">/{node.slug}</p>
              </div>
           </div>

           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <button 
                onClick={() => openCreateModal(node)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#800000] text-white hover:bg-black transition-colors shadow-md"
                title="Add Sub-Category"
              >
                 <Plus size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Add Sub</span>
              </button>
              
              <button 
                onClick={() => { if(confirm(`Delete ${node.name} and all its sub-categories?`)) deleteCategory(node._id); }}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                title="Delete Category"
              >
                 <Trash2 size={14} />
              </button>
           </div>
        </div>

        {hasChildren && (
           <div className="pl-12 ml-6 border-l border-dashed border-[#dcdcdc]">
              {node.children.map(child => (
                 <CategoryNode key={child._id} node={child} depth={depth + 1} />
              ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope p-4 md:p-8 pt-24 lg:pt-8" ref={containerRef}>
      
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
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.3em] text-[10px]">Organization</span>
            <h1 className="font-bodoni text-4xl mt-2 text-black">Categories</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage your store hierarchy efficiently.</p>
          </div>
          <button 
            onClick={() => openCreateModal(null)} 
            className="mt-4 md:mt-0 bg-[#800000] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black flex items-center gap-2 transition-all shadow-lg shadow-[#800000]/20 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Root Category
          </button>
        </div>

        <div className="space-y-2">
           {categories.length > 0 ? (
              categories.map(cat => <CategoryNode key={cat._id} node={cat} />)
           ) : (
              <div className="py-32 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                    <Layers size={32} className="opacity-20 text-black" />
                 </div>
                 <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No categories yet</p>
                 <p className="text-xs mt-1 text-gray-300">Start by creating a root category above.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}