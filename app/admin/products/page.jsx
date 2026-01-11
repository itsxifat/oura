'use client';

import Link from 'next/link';
import { 
  Plus, Trash2, Package, Search, Edit3, 
  Filter, X, Check, Tag as TagIcon, MoreHorizontal,
  ChevronDown, Calendar, AlertCircle, Layers
} from 'lucide-react';
import { getAdminProducts, deleteProduct, getCategories, getTags, updateProductTags } from '@/app/actions';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER: FLATTEN CATEGORIES ---
const flattenCategories = (categories, depth = 0) => {
  let flat = [];
  categories.forEach(cat => {
    flat.push({ _id: cat._id, name: cat.name, label: `${'\u00A0\u00A0'.repeat(depth * 2)}${cat.name}` });
    if (cat.children?.length > 0) flat = flat.concat(flattenCategories(cat.children, depth + 1));
  });
  return flat;
};

// --- QUICK TAG MODAL ---
const QuickTagModal = ({ product, availableTags, onClose, onUpdate }) => {
  const [selectedTags, setSelectedTags] = useState(product.tags ? product.tags.map(t => t._id) : []);
  const [saving, setSaving] = useState(false);

  const toggleTag = (id) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProductTags(product._id, selectedTags);
    await onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h3 className="font-bodoni text-lg text-black">Manage Tags</h3>
           <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-black"/></button>
        </div>
        <div className="p-6">
           <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest font-bold">Select tags for "{product.name}"</p>
           <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
              {availableTags.map(tag => {
                 const isActive = selectedTags.includes(tag._id);
                 return (
                   <button 
                     key={tag._id} 
                     onClick={() => toggleTag(tag._id)}
                     className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${isActive ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                   >
                     {tag.name}
                   </button>
                 );
              })}
           </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
           <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Cancel</button>
           <button onClick={handleSave} disabled={saving} className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Tags'}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter Data
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // all, in, out
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Modal State
  const [tagModalProduct, setTagModalProduct] = useState(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    const [prods, cats, tgs] = await Promise.all([
      getAdminProducts(),
      getCategories(),
      getTags()
    ]);
    setProducts(prods);
    setCategories(flattenCategories(cats));
    setTags(tgs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search (Name, SKU, Barcode)
      const q = search.toLowerCase();
      const matchesSearch = !q || 
          p.name.toLowerCase().includes(q) || 
          (p.sku && p.sku.toLowerCase().includes(q)) || 
          (p.barcode && p.barcode.toLowerCase().includes(q));

      // 2. Category
      const matchesCat = !filterCat || p.category?._id === filterCat;

      // 3. Tag
      const matchesTag = !filterTag || p.tags?.some(t => t._id === filterTag);

      // 4. Stock
      let matchesStock = true;
      if (filterStock === 'in') matchesStock = p.stock > 0;
      if (filterStock === 'out') matchesStock = p.stock === 0;

      // 5. Price
      const matchesMinPrice = !priceRange.min || p.price >= Number(priceRange.min);
      const matchesMaxPrice = !priceRange.max || p.price <= Number(priceRange.max);

      return matchesSearch && matchesCat && matchesTag && matchesStock && matchesMinPrice && matchesMaxPrice;
    });
  }, [products, search, filterCat, filterTag, filterStock, priceRange]);

  const handleDelete = async (id) => {
    if (confirm('Permanently delete this product?')) {
      await deleteProduct(id);
      loadData(); 
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-200 pb-8 gap-4">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Inventory</span>
            <h1 className="font-bodoni text-3xl md:text-5xl mt-2 text-black">Products</h1>
          </div>
          <Link href="/admin/products/new" className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg flex items-center justify-center gap-2">
            <Plus size={16} /> Create Product
          </Link>
        </div>

        {/* --- CONTROLS --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8">
           <div className="flex flex-col md:flex-row gap-4 items-center">
             {/* Search */}
             <div className="relative flex-1 w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search by Name, SKU, Barcode..." 
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl text-sm outline-none transition-all"
                 />
             </div>
             
             {/* Filter Toggle */}
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`w-full md:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'}`}
             >
                 <Filter size={16}/> Filters
             </button>
           </div>

           {/* Filter Panel */}
           <AnimatePresence>
             {showFilters && (
               <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden">
                  <div className="pt-6 mt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                         <div className="relative">
                            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm border-transparent focus:border-black border outline-none appearance-none cursor-pointer">
                               <option value="">All Categories</option>
                               {categories.map(c => <option key={c._id} value={c._id}>{c.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tag</label>
                         <div className="relative">
                            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm border-transparent focus:border-black border outline-none appearance-none cursor-pointer">
                               <option value="">All Tags</option>
                               {tags.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Status</label>
                         <div className="relative">
                            <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm border-transparent focus:border-black border outline-none appearance-none cursor-pointer">
                               <option value="all">All Items</option>
                               <option value="in">In Stock Only</option>
                               <option value="out">Out of Stock</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                         </div>
                      </div>

                      <div className="space-y-2 col-span-1 md:col-span-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price Range</label>
                         <div className="flex gap-2">
                            <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min:e.target.value})} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm outline-none border focus:border-black"/>
                            <span className="text-gray-400 flex items-center">-</span>
                            <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max:e.target.value})} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm outline-none border focus:border-black"/>
                         </div>
                      </div>

                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* --- PRODUCT LIST (Responsive Table/Grid) --- */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          
          {/* MOBILE VIEW (Cards) - Hidden on md+ */}
          <div className="md:hidden divide-y divide-gray-100">
             {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : filteredProducts.map(product => (
                <div key={product._id} className="p-4 flex gap-4">
                   <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={product.images?.[0] || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-sm text-black truncate pr-2">{product.name}</h3>
                         <div className="flex gap-2">
                            <Link href={`/admin/products/${product._id}`} className="text-gray-400 hover:text-black"><Edit3 size={16}/></Link>
                            <button onClick={() => handleDelete(product._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="font-bold text-black">৳{product.price}</span>
                         {product.stock > 0 
                            ? <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">In Stock ({product.stock})</span> 
                            : <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">Out of Stock</span>
                         }
                      </div>
                   </div>
                </div>
             ))}
          </div>

          {/* DESKTOP VIEW (Table) - Hidden on sm */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                  <th className="p-6 pl-8">Product</th>
                  <th className="p-6">Details</th>
                  <th className="p-6">Inventory</th>
                  <th className="p-6">Price</th>
                  <th className="p-6 text-right pr-8">Manage</th>
                </tr>
              </thead>
              
              <tbody className="text-sm divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-6"><div className="h-12 w-12 bg-gray-100 rounded-md"></div></td>
                      <td colSpan="4" className="p-6"><div className="h-4 w-full bg-gray-100 rounded"></div></td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-gray-400">
                      <Package size={48} className="mx-auto mb-4 opacity-20"/>
                      <span className="uppercase tracking-widest text-xs font-bold block">No products found</span>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="group hover:bg-[#faf9f6] transition-colors">
                      
                      {/* 1. Identity */}
                      <td className="p-6 pl-8">
                        <div className="flex items-center gap-5">
                          <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"><img src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} className="w-full h-full object-cover" /></div>
                          <div>
                             <p className="font-bodoni text-lg text-gray-900 line-clamp-1">{product.name}</p>
                             <div className="flex gap-3 text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                                <span className="font-mono bg-gray-100 px-1.5 rounded">{product.sku || 'NO SKU'}</span>
                                {product.barcode && <span className="font-mono bg-gray-100 px-1.5 rounded">{product.barcode}</span>}
                             </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Metadata */}
                      <td className="p-6">
                        <div className="space-y-2">
                           <span className="inline-block px-2 py-0.5 rounded border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider bg-white">
                              {product.category?.name || 'Uncategorized'}
                           </span>
                           <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {product.tags && product.tags.length > 0 ? (
                                  product.tags.map(tag => (
                                      <span key={tag._id} className="text-[9px] font-bold uppercase tracking-wide text-white px-1.5 py-0.5 rounded" style={{backgroundColor: tag.color || '#000'}}>{tag.name}</span>
                                  ))
                              ) : <span className="text-gray-300 text-[10px] italic">No Tags</span>}
                              
                              <button onClick={() => setTagModalProduct(product)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-gray-200 rounded hover:bg-[#D4AF37] hover:text-white" title="Manage Tags">
                                  <Plus size={10}/>
                              </button>
                           </div>
                        </div>
                      </td>

                      {/* 3. Inventory (NEW) */}
                      <td className="p-6">
                        <div className="space-y-1">
                            {product.stock > 0 ? (
                              <span className="text-green-600 text-xs font-bold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {product.stock} Total
                              </span>
                            ) : (
                              <span className="text-red-500 text-xs font-bold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Out of Stock
                              </span>
                            )}
                            
                            {/* Variant Preview */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="text-[9px] text-gray-400 font-mono mt-1">
                                    {product.variants.slice(0, 3).map(v => `${v.size}:${v.stock}`).join(' | ')}
                                    {product.variants.length > 3 && '...'}
                                </div>
                            )}
                        </div>
                      </td>

                      {/* 4. Price */}
                      <td className="p-6">
                          <div className="font-bold text-black">৳{product.price?.toLocaleString()}</div>
                          {product.discountPrice && (
                             <div className="text-xs text-red-500 font-bold">Offer: ৳{product.discountPrice.toLocaleString()}</div>
                          )}
                      </td>

                      {/* 5. Actions */}
                      <td className="p-6 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* FIX: Correct Edit Route */}
                          <Link href={`/admin/products/${product._id}`} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-all bg-white"><Edit3 size={14} /></Link>
                          <button onClick={() => handleDelete(product._id)} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all bg-white"><Trash2 size={14} /></button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- MODAL --- */}
      {tagModalProduct && (
         <QuickTagModal 
            product={tagModalProduct} 
            availableTags={tags} 
            onClose={() => setTagModalProduct(null)} 
            onUpdate={loadData}
         />
      )}

    </div>
  );
}