'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCategoryPageData } from '@/app/actions';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, X, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard'; 

// --- INLINE DEBOUNCE HOOK ---
function useDebounceValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CategoryPage({ params }) {
  // State
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true); // For first load only
  const [isFiltering, setIsFiltering] = useState(false);      // For subsequent updates
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Debounce Search
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  
  // Keep track if we mounted to avoid double fetch
  const isMounted = useRef(false);

  // 1. Fetch Data Function
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setIsFiltering(true);

    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug; 
        
        const filterParams = { 
        search: debouncedSearch, 
        minPrice: priceRange.min, 
        maxPrice: priceRange.max 
        };
        
        const result = await getCategoryPageData(slug, filterParams);
        setData(result);
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        setInitialLoading(false);
        setIsFiltering(false);
    }
  }, [params, debouncedSearch, priceRange.min, priceRange.max]);

  // 2. Trigger Fetch
  useEffect(() => {
    // Prevent double fetch on strict mode, but ensure it runs on debounce change
    fetchData(data === null); 
  }, [fetchData]);

  // Handle Manual Submit (Enter key)
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchData(false);
  };

  // --- RENDER ---

  // 1. Initial Full Page Load (Only time we show full spinner)
  if (initialLoading && !data) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
          <div className="w-12 h-12 border-4 border-[#B91C1C] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-heading font-bold uppercase tracking-widest text-xs">Loading Collection...</p>
      </div>
  );
  
  if (!data && !initialLoading) return (
    <div className="min-h-screen pt-40 text-center font-heading text-2xl">Category not found.</div>
  );

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#B91C1C] selection:text-white">
      <Navbar />

      {/* --- HEADER (Always Visible - No flickering) --- */}
      <div className="pt-5 pb-8 px-6 text-center bg-white relative z-10">
        <h1 className="font-heading font-black text-5xl md:text-7xl uppercase tracking-tighter mb-4 text-black">
            {data.mainCategory.name}
        </h1>
        <div className="flex items-center justify-center gap-4">
             <div className="w-8 h-[2px] bg-[#B91C1C]"></div>
             <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.25em]">
                {data.sections.length > 0 ? `${data.sections.length} Sub-Collections` : 'Exclusive Selection'}
             </p>
             <div className="w-8 h-[2px] bg-[#B91C1C]"></div>
        </div>

        {/* --- SEARCH & FILTERS --- */}
        <div className="mt-8 max-w-4xl mx-auto">
             <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B91C1C] transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="SEARCH..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-6 pr-4 py-2 bg-transparent border-b border-gray-200 text-sm font-bold uppercase tracking-wide focus:border-[#B91C1C] focus:outline-none placeholder-gray-300 transition-colors"
                    />
                    {isFiltering && (
                         <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="animate-spin text-[#B91C1C]" />
                         </div>
                    )}
                </div>

                {/* Filter Toggle */}
                <button 
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-5 py-2 border transition-all text-[10px] font-black uppercase tracking-[0.2em]
                    ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-[#B91C1C] hover:text-[#B91C1C]'}
                  `}
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
             </div>

             {/* Expandable Filter Area */}
             <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                     <form onSubmit={handleFilterSubmit} className="mt-4 pt-4 border-t border-dashed border-gray-200 flex items-center justify-center gap-3">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Price</span>
                        <input 
                          placeholder="MIN" 
                          type="number" 
                          className="w-16 p-1.5 bg-gray-50 border border-gray-200 text-center text-xs font-bold focus:border-[#B91C1C] outline-none"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                          placeholder="MAX" 
                          type="number" 
                          className="w-16 p-1.5 bg-gray-50 border border-gray-200 text-center text-xs font-bold focus:border-[#B91C1C] outline-none"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        />
                        <button type="submit" className="bg-[#B91C1C] text-white px-5 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                            Apply
                        </button>
                     </form>
                  </motion.div>
                )}
             </AnimatePresence>
        </div>
      </div>

      {/* --- CONTENT AREA (Relative for Loading Overlay) --- */}
      <div className="relative min-h-[400px]">
          
          {/* Loading Overlay (Subtle) */}
          <AnimatePresence>
            {isFiltering && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-start pt-20 justify-center"
                >
                    <div className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full shadow-xl">
                        <Loader2 size={16} className="animate-spin text-[#B91C1C]" />
                        <span className="text-xs font-bold uppercase tracking-widest">Updating...</span>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-[1920px] mx-auto px-4 md:px-8 pb-24">
            
            {/* 1. Main Products */}
            {data.mainProducts.length > 0 && (
               <ProductGrid title="All Items" products={data.mainProducts} />
            )}

            {/* 2. Sub-Category Sections */}
            {data.sections.map((section) => (
               section.products.length > 0 && (
                 <ProductGrid 
                   key={section._id} 
                   title={section.name} 
                   products={section.products} 
                 />
               )
            ))}

            {/* Empty State */}
            {data.sections.every(s => s.products.length === 0) && data.mainProducts.length === 0 && (
               <div className="text-center py-20">
                  <p className="font-heading text-2xl text-gray-300 uppercase mb-4">No items found.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setPriceRange({min:'', max:''}); }} 
                    className="px-6 py-2 border border-gray-200 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
                  >
                      Clear All Filters
                  </button>
               </div>
            )}
          </div>
      </div>
    </div>
  );
}

// --- REUSABLE PRODUCT GRID ---
function ProductGrid({ title, products }) {
  return (
    <div className="mb-16">
      <div className="flex items-center gap-4 mb-6">
         <h2 className="text-2xl md:text-3xl font-heading font-black uppercase tracking-tight text-black">{title}</h2>
         <div className="flex-1 h-[1px] bg-gray-100"></div>
      </div>

      {/* Grid: Optimized Gap & Columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-8 md:gap-x-4">
        {products.map((product) => (
           <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}