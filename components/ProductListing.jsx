'use client';

/**
 * ANAQA COMMERCE ENGINE - v4.0 (Mobile Luxury Edition)
 * Features:
 * - Adaptive Filter Drawer (Bottom Sheet on Mobile / Side Panel on Desktop)
 * - "Haptic" Visual Feedback on Filters
 * - Glitch-Free GSAP Animations
 * - Ultra-Minimal Header
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, Eye, Heart, Filter, ChevronDown, 
  LayoutGrid, List, ArrowRight, X, Check, SlidersHorizontal, 
  Search, ArrowUpRight, RefreshCw, XCircle, Minus, Plus 
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- INITIALIZATION ---
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ----------------------------------------------------------------------------
// 1. ASSETS & UTILS
// ----------------------------------------------------------------------------

const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

const PriceDisplay = ({ price, discountPrice, size = 'sm' }) => {
  const textSize = size === 'lg' ? 'text-lg md:text-xl' : 'text-sm';
  
  if (discountPrice && discountPrice < price) {
    return (
      <div className={`flex items-center gap-3 font-manrope ${textSize}`}>
        <span className="text-gray-400 line-through decoration-gray-300 flex items-center">
          <Taka size={size === 'lg' ? 14 : 10} />{price.toLocaleString()}
        </span>
        <span className="text-[#D4AF37] font-bold flex items-center">
          <Taka size={size === 'lg' ? 16 : 12} weight="bold" />{discountPrice.toLocaleString()}
        </span>
      </div>
    );
  }
  return (
    <span className={`text-black font-medium font-manrope flex items-center ${textSize}`}>
      <Taka size={size === 'lg' ? 16 : 12} />{price.toLocaleString()}
    </span>
  );
};

// --- NEW PREMIUM FILTER OPTION ---
const FilterOption = ({ label, count, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-4 text-xs uppercase tracking-widest transition-all duration-200 border border-transparent rounded-none group active:scale-[0.98]
      ${active 
        ? 'bg-black text-white border-black shadow-md' 
        : 'bg-gray-50/50 text-gray-500 hover:bg-white hover:border-gray-200 hover:text-black'
      }`}
  >
    <span className="font-bold flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full border border-current flex items-center justify-center ${active ? 'border-white' : 'border-gray-400'}`}>
         {active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-in zoom-in" />}
      </div>
      {label}
    </span>
    <span className={`text-[10px] font-mono ${active ? 'text-white/60' : 'text-gray-300 group-hover:text-black'}`}>
      {count}
    </span>
  </button>
);

// --- SKELETON LOADER ---
const ProductSkeleton = () => (
  <div className="flex flex-col gap-4 animate-pulse opacity-50">
    <div className="aspect-[3/4] bg-gray-100 w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
    <div className="space-y-3 text-center px-4 pt-2">
      <div className="h-2 bg-gray-200 w-1/3 mx-auto" />
      <div className="h-4 bg-gray-200 w-3/4 mx-auto" />
    </div>
  </div>
);

// ----------------------------------------------------------------------------
// 2. MAIN COMPONENT
// ----------------------------------------------------------------------------

export default function ProductListing({ initialProducts }) {
  // --- STATE ---
  const [products] = useState(initialProducts || []);
  
  // Logic
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({ categories: [], tags: [] });
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  
  // UI
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef(null);
  const filterPanelRef = useRef(null);

  // --- DATA ENGINE ---
  const facets = useMemo(() => {
    const cats = {};
    const tags = {};
    products.forEach(p => {
      if (p.category?.name) cats[p.category.name] = (cats[p.category.name] || 0) + 1;
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => { if (t.name) tags[t.name] = (tags[t.name] || 0) + 1; });
      }
    });
    return {
      categories: Object.entries(cats).map(([name, count]) => ({ name, count })),
      tags: Object.entries(tags).map(([name, count]) => ({ name, count }))
    };
  }, [products]);

  const processedData = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.name.toLowerCase().includes(q)))
      );
    }
    if (activeFilters.categories.length > 0) {
      result = result.filter(p => p.category && activeFilters.categories.includes(p.category.name));
    }
    if (activeFilters.tags.length > 0) {
      result = result.filter(p => p.tags && p.tags.some(t => activeFilters.tags.includes(t.name)));
    }
    const getPrice = (p) => p.discountPrice || p.price;
    result.sort((a, b) => {
      switch (sortOption) {
        case 'priceAsc': return getPrice(a) - getPrice(b);
        case 'priceDesc': return getPrice(b) - getPrice(a);
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'newest': default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return result;
  }, [products, searchQuery, activeFilters, sortOption]);

  // --- ANIMATION EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    ScrollTrigger.refresh();
    
    // Animate Filter Panel Opening
    if (isFilterOpen && filterPanelRef.current) {
      gsap.to(filterPanelRef.current, { x: '0%', y: '0%', duration: 0.5, ease: 'power3.out' });
    } else if (filterPanelRef.current) {
      // Responsive Exit Animation
      const isMobile = window.innerWidth < 768;
      gsap.to(filterPanelRef.current, { 
        x: isMobile ? '0%' : '100%', 
        y: isMobile ? '100%' : '0%', 
        duration: 0.4, 
        ease: 'power3.in' 
      });
    }

    if (processedData.length > 0) {
      gsap.fromTo(".product-item", 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out", overwrite: 'auto' }
      );
    }
  }, [processedData, loading, viewMode, isFilterOpen]);

  const toggleFilter = (type, value) => {
    setActiveFilters(prev => {
      const list = prev[type];
      const newList = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
      return { ...prev, [type]: newList };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ categories: [], tags: [] });
    setSearchQuery('');
  };

  return (
    <main ref={containerRef} className="bg-white min-h-screen pb-32 font-manrope selection:bg-black selection:text-[#D4AF37] overflow-x-hidden">
      
      {/* --- ADAPTIVE FILTER DRAWER --- */}
      {/* Mobile: Bottom Sheet | Desktop: Side Panel */}
      <div 
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsFilterOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        {/* Panel Container */}
        <div 
          ref={filterPanelRef}
          className="absolute bg-white shadow-2xl flex flex-col 
            /* Mobile Styles: Bottom Sheet, Full Width, Rounded Top */
            bottom-0 left-0 right-0 h-[85vh] w-full rounded-t-3xl transform translate-y-full
            /* Desktop Styles: Right Panel, Max Width, Square */
            md:top-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:w-[420px] md:max-w-md md:rounded-none md:translate-y-0 md:translate-x-full"
        >
           {/* Handle for Mobile Drag Hint */}
           <div className="md:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
           </div>

           {/* Header */}
           <div className="px-6 md:px-8 py-4 md:py-8 border-b border-gray-100 flex justify-between items-center bg-white z-10 rounded-t-3xl md:rounded-none">
              <div>
                <h2 className="font-bodoni text-2xl md:text-3xl text-black">Filter</h2>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">{processedData.length} Items</p>
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-black hover:text-white rounded-full transition-all"
              >
                 <X size={20} />
              </button>
           </div>
           
           {/* Scrollable Options */}
           <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              
              {/* Categories */}
              {facets.categories.length > 0 && (
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-4 flex items-center gap-2">
                     Category <span className="w-full h-[1px] bg-gray-100"></span>
                   </h3>
                   <div className="space-y-2">
                     {facets.categories.map((cat) => (
                       <FilterOption 
                         key={cat.name} 
                         label={cat.name} 
                         count={cat.count}
                         active={activeFilters.categories.includes(cat.name)}
                         onClick={() => toggleFilter('categories', cat.name)}
                       />
                     ))}
                   </div>
                </div>
              )}

              {/* Tags */}
              {facets.tags.length > 0 && (
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-4 flex items-center gap-2">
                     Collection <span className="w-full h-[1px] bg-gray-100"></span>
                   </h3>
                   <div className="space-y-2">
                     {facets.tags.map((tag) => (
                       <FilterOption 
                         key={tag.name} 
                         label={tag.name} 
                         count={tag.count}
                         active={activeFilters.tags.includes(tag.name)}
                         onClick={() => toggleFilter('tags', tag.name)}
                       />
                     ))}
                   </div>
                </div>
              )}
           </div>

           {/* Footer Actions */}
           <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur pb-8 md:pb-8 space-y-3 z-10">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-black text-white h-12 md:h-14 text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#D4AF37] transition-colors shadow-lg active:scale-95 duration-200"
              >
                 Show Results
              </button>
              <button 
                onClick={clearFilters}
                className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                 <RefreshCw size={12}/> Reset
              </button>
           </div>
        </div>
      </div>



      {/* --- TOOLBAR --- */}
      <section className="border-b border-gray-100 bg-white sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          
          {/* FILTER BUTTON */}
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#D4AF37] transition group pl-2"
          >
            <Filter size={16} /> 
            <span>Filter</span>
            {(activeFilters.categories.length + activeFilters.tags.length) > 0 && (
               <span className="w-5 h-5 bg-black text-white text-[9px] flex items-center justify-center rounded-full ml-1 animate-in zoom-in">
                 {activeFilters.categories.length + activeFilters.tags.length}
               </span>
            )}
          </button>

          {/* SEARCH (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-2 border-b border-transparent hover:border-gray-200 transition-colors w-64 pb-1">
             <Search size={14} className="text-gray-400"/>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="SEARCH..." 
               className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-full placeholder:text-gray-300"
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-red-500"><XCircle size={12}/></button>
             )}
          </div>

          {/* SORT & VIEW */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="relative">
               <button 
                 onClick={() => setIsSortOpen(!isSortOpen)}
                 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#D4AF37] transition pr-2"
               >
                 Sort <ChevronDown size={14} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}/>
               </button>
               
               {/* Sort Dropdown */}
               <div className={`absolute top-full right-0 mt-4 w-48 bg-white shadow-xl border border-gray-100 py-2 z-50 transition-all duration-300 origin-top-right ${isSortOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  {[
                    { label: 'Newest In', val: 'newest' },
                    { label: 'Price: Low to High', val: 'priceAsc' },
                    { label: 'Price: High to Low', val: 'priceDesc' },
                    { label: 'Name: A-Z', val: 'nameAsc' }
                  ].map((opt) => (
                     <button 
                       key={opt.val} 
                       onClick={() => { setSortOption(opt.val); setIsSortOpen(false); }}
                       className={`w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${sortOption === opt.val ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}
                     >
                        {opt.label}
                     </button>
                  ))}
               </div>
            </div>
            
            {/* View Toggle (Desktop Only) */}
            <div className="hidden md:flex items-center gap-4 border-l border-gray-200 pl-8">
               <button onClick={() => setViewMode('grid')} className={`opacity-40 hover:opacity-100 transition-opacity ${viewMode === 'grid' ? 'opacity-100' : ''}`}>
                  <LayoutGrid size={16} />
               </button>
               <button onClick={() => setViewMode('list')} className={`opacity-40 hover:opacity-100 transition-opacity ${viewMode === 'list' ? 'opacity-100' : ''}`}>
                  <List size={18} />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- GRID DISPLAY --- */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-16 pt-12 min-h-[60vh]">
        
        {loading ? (
          /* SKELETON */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
             {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : processedData.length > 0 ? (
          /* PRODUCTS */
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-12 md:gap-x-10 md:gap-y-24' 
              : 'flex flex-col gap-0 max-w-5xl mx-auto'
          }>
            {processedData.map((product) => (
               <div key={product._id} className="product-item">
                  <ProductCardRenderer product={product} viewMode={viewMode} />
               </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-20 h-20 border border-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
               <ShoppingBag size={32} strokeWidth={0.5} />
            </div>
            <h3 className="font-bodoni text-3xl text-black mb-2">0 Results</h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-8">
              Refine your search criteria
            </p>
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-colors"
            >
               <RefreshCw size={14} /> Clear All
            </button>
          </div>
        )}
      </div>

    </main>
  );
}

// --- PRODUCT CARD RENDERER ---
const ProductCardRenderer = ({ product, viewMode }) => {
  const label = (product.tags && product.tags.length > 0 ? product.tags[0].name : product.category?.name) || 'Collection';
  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  if (viewMode === 'list') {
    return (
      <div className="group flex flex-col md:flex-row gap-8 items-center border-b border-gray-100 py-10">
        <Link href={`/product/${product.slug}`} className="block w-full md:w-64 aspect-[3/4] bg-gray-100 relative overflow-hidden shrink-0">
          <Image src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
        <div className="flex-1 text-center md:text-left w-full">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">{label}</p>
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-bodoni text-3xl text-black mb-4 group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
          </Link>
          <p className="text-sm text-gray-500 max-w-xl line-clamp-2 mb-6 hidden md:block leading-relaxed">{product.description}</p>
          <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f9f9f9] mb-4 md:mb-6">
          <img src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105" />
          {product.images?.[1] && (
            <img src={product.images[1]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 z-10" />
          )}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20 flex flex-col gap-2 items-start">
            {discountPercent > 0 && <span className="bg-white text-black text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-2 py-1 shadow-sm">-{discountPercent}%</span>}
            {product.stock === 0 && <span className="bg-black text-white text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-2 py-1 shadow-sm">Sold Out</span>}
          </div>
        </div>
        <div className="text-center px-1">
          <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-2 relative inline-block group-hover:text-[#D4AF37] transition-colors">{label}</p>
          <h3 className="font-bodoni text-base md:text-lg text-black mb-1 md:mb-2 leading-tight line-clamp-1 group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
          <div className="flex justify-center"><PriceDisplay price={product.price} discountPrice={product.discountPrice} /></div>
        </div>
      </Link>
    </div>
  );
};