'use client';

/**
 * OURA COMMERCE ENGINE - v7.0 (Dense Grid Edition)
 * - 5 Columns Desktop / 3 Columns Mobile
 * - Dynamic Tag Colors
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, Filter, ChevronDown, 
  LayoutGrid, List, X, Check, Search, 
  RefreshCw, XCircle 
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ----------------------------------------------------------------------------
// 1. ASSETS
// ----------------------------------------------------------------------------

const Taka = ({ size = 10, className = "", weight = "normal" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

const PriceDisplay = ({ price, discountPrice, size = 'sm' }) => {
  const textSize = size === 'lg' ? 'text-lg md:text-xl' : 'text-[10px] md:text-xs'; // Smaller text for dense grid
  
  if (discountPrice && discountPrice < price) {
    return (
      <div className={`flex items-center gap-1.5 font-manrope ${textSize}`}>
        <span className="text-gray-400 line-through decoration-gray-300 text-[9px] md:text-[10px]">
          <Taka size={9} />{price.toLocaleString()}
        </span>
        <span className="text-[#B91C1C] font-bold flex items-center">
          <Taka size={size === 'lg' ? 16 : 11} weight="bold" />{discountPrice.toLocaleString()}
        </span>
      </div>
    );
  }
  return (
    <span className={`text-black font-medium font-manrope flex items-center ${textSize}`}>
      <Taka size={size === 'lg' ? 16 : 11} />{price.toLocaleString()}
    </span>
  );
};

// --- FILTER OPTION ---
const FilterOption = ({ label, count, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-1 py-3 text-[11px] uppercase tracking-widest transition-all duration-200 border-b border-gray-50 hover:pl-2 group
      ${active ? 'text-black font-bold' : 'text-gray-500 hover:text-[#B91C1C]'}`}
  >
    <span className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${active ? 'bg-[#B91C1C] scale-100' : 'bg-gray-200 scale-75 group-hover:bg-[#B91C1C]'}`} />
      {label}
    </span>
    <span className="text-[9px] font-mono text-gray-300">{count}</span>
  </button>
);

const ProductSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="aspect-[3/4] bg-gray-100 w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
    <div className="h-2 bg-gray-100 w-2/3 mx-auto" />
    <div className="h-2 bg-gray-100 w-1/3 mx-auto" />
  </div>
);

// ----------------------------------------------------------------------------
// 2. MAIN COMPONENT
// ----------------------------------------------------------------------------

export default function ProductListing({ initialProducts }) {
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

  // Data Engine
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
    if (activeFilters.categories.length > 0) result = result.filter(p => p.category && activeFilters.categories.includes(p.category.name));
    if (activeFilters.tags.length > 0) result = result.filter(p => p.tags && p.tags.some(t => activeFilters.tags.includes(t.name)));
    
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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    ScrollTrigger.refresh();
    
    if (isFilterOpen && filterPanelRef.current) {
      gsap.to(filterPanelRef.current, { x: '0%', duration: 0.5, ease: 'power3.out' });
    } else if (filterPanelRef.current) {
      gsap.to(filterPanelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
    }

    if (processedData.length > 0) {
      gsap.fromTo(".product-item", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "power2.out", overwrite: 'auto' }
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
    <main ref={containerRef} className="bg-white min-h-screen pb-32 font-manrope selection:bg-[#B91C1C] selection:text-white overflow-x-hidden">
      
      {/* --- FILTER DRAWER --- */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsFilterOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div ref={filterPanelRef} className="absolute top-0 right-0 h-full w-[350px] max-w-[85vw] bg-white shadow-2xl flex flex-col transform translate-x-full">
           <div className="px-8 py-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-heading font-black text-2xl text-black uppercase">Filter</h2>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">{processedData.length} Items</p>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="hover:text-[#B91C1C]"><X size={24} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {facets.categories.length > 0 && (
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Category</h3>
                   <div className="space-y-1">{facets.categories.map((cat) => (<FilterOption key={cat.name} label={cat.name} count={cat.count} active={activeFilters.categories.includes(cat.name)} onClick={() => toggleFilter('categories', cat.name)} />))}</div>
                </div>
              )}
              {facets.tags.length > 0 && (
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Collection</h3>
                   <div className="space-y-1">{facets.tags.map((tag) => (<FilterOption key={tag.name} label={tag.name} count={tag.count} active={activeFilters.tags.includes(tag.name)} onClick={() => toggleFilter('tags', tag.name)} />))}</div>
                </div>
              )}
           </div>

           <div className="p-8 border-t border-gray-100 bg-gray-50 space-y-3">
              <button onClick={() => setIsFilterOpen(false)} className="w-full bg-black text-white h-12 text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#B91C1C] transition-colors">Apply</button>
              <button onClick={clearFilters} className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"><RefreshCw size={12}/> Reset</button>
           </div>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center justify-between">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#B91C1C] transition group pl-1">
            <Filter size={14} /> <span>Filter</span>
            {(activeFilters.categories.length + activeFilters.tags.length) > 0 && <span className="w-4 h-4 bg-[#B91C1C] text-white text-[8px] flex items-center justify-center rounded-full">{activeFilters.categories.length + activeFilters.tags.length}</span>}
          </button>

          <div className="hidden lg:flex items-center gap-2 border-b border-transparent hover:border-gray-200 transition-colors w-64 pb-1">
             <Search size={14} className="text-gray-400"/>
             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="SEARCH..." className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-full placeholder:text-gray-300"/>
             {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-[#B91C1C]"><XCircle size={12}/></button>}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
               <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#B91C1C] transition">Sort <ChevronDown size={12} /></button>
               <div className={`absolute top-full right-0 mt-4 w-40 bg-white shadow-xl border border-gray-100 py-1 z-50 transition-all ${isSortOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  {[{l:'Newest',v:'newest'},{l:'Price Low-High',v:'priceAsc'},{l:'Price High-Low',v:'priceDesc'}].map((opt) => (
                      <button key={opt.v} onClick={() => { setSortOption(opt.v); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 ${sortOption === opt.v ? 'text-[#B91C1C]' : 'text-gray-500'}`}>{opt.l}</button>
                  ))}
               </div>
            </div>
            <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-6">
               <button onClick={() => setViewMode('grid')} className={`opacity-40 hover:opacity-100 hover:text-[#B91C1C] transition-all ${viewMode === 'grid' ? 'opacity-100 text-black' : ''}`}><LayoutGrid size={16} /></button>
               <button onClick={() => setViewMode('list')} className={`opacity-40 hover:opacity-100 hover:text-[#B91C1C] transition-all ${viewMode === 'list' ? 'opacity-100 text-black' : ''}`}><List size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* --- GRID --- */}
      <div className="max-w-[1920px] mx-auto px-3 md:px-8 pt-8 min-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 lg:gap-6">
             {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : processedData.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              // ✅ 3 Columns Mobile / 5 Columns Desktop
              ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-8 md:gap-x-4 md:gap-y-12 lg:gap-x-6 lg:gap-y-16' 
              : 'flex flex-col gap-0 max-w-4xl mx-auto'
          }>
            {processedData.map((product) => (
               <div key={product._id} className="product-item">
                  <ProductCardRenderer product={product} viewMode={viewMode} />
               </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <h3 className="font-heading font-black text-xl text-black mb-2 uppercase">No Matches</h3>
            <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] border-b border-[#B91C1C]">Clear All Filters</button>
          </div>
        )}
      </div>
    </main>
  );
}

// --- CARD RENDERER ---
const ProductCardRenderer = ({ product, viewMode }) => {
  // ✅ FIX: Extract Tag Name & Color from Database Object
  const tagData = useMemo(() => {
      // 1. DB Tag (with color)
      if (product.tags && product.tags.length > 0) {
          const t = product.tags[0];
          if (t && typeof t === 'object' && t.name) {
              return { name: t.name, color: t.color || '#B91C1C' };
          }
      }
      // 2. Sale Fallback
      if (product.discountPrice) return { name: "SALE", color: '#B91C1C' };
      // 3. Category Fallback (No Color)
      if (product.category?.name) return { name: product.category.name, color: 'transparent' };
      
      return null;
  }, [product]);

  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  if (viewMode === 'list') {
    return (
      <div className="group flex flex-col md:flex-row gap-6 items-center border-b border-gray-100 py-8">
        <Link href={`/product/${product.slug}`} className="block w-full md:w-48 aspect-[3/4] bg-gray-100 relative overflow-hidden shrink-0">
          <Image src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="20vw" quality={90} />
        </Link>
        <div className="flex-1 text-center md:text-left">
          {tagData && <p className="text-[9px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: tagData.color !== 'transparent' ? tagData.color : '#9CA3AF' }}>{tagData.name}</p>}
          <Link href={`/product/${product.slug}`}><h3 className="font-heading font-black text-xl text-black mb-2 hover:text-[#B91C1C] transition-colors uppercase">{product.name}</h3></Link>
          <p className="text-xs text-gray-500 max-w-lg line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
          <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 mb-3">
          <Image 
            src={product.images?.[0] || '/placeholder.jpg'} 
            alt={product.name} 
            fill 
            className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 will-change-transform" 
            sizes="(max-width: 768px) 33vw, 20vw"
            quality={90}
          />
          {product.images?.[1] && (
            <Image src={product.images[1]} alt={product.name} fill className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 z-10" sizes="(max-width: 768px) 33vw, 20vw" quality={90} />
          )}
          
          <div className="absolute top-0 left-0 p-2 z-20 flex flex-col items-start gap-1">
             {discountPercent > 0 && <span className="bg-[#B91C1C] text-white text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 shadow-sm">-{discountPercent}%</span>}
             {product.stock === 0 && <span className="bg-black text-white text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 shadow-sm">Sold Out</span>}
          </div>
        </div>
        
        <div className="text-center px-1">
          {/* ✅ DYNAMIC COLORED TAG */}
          {tagData && (
              <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.25em] mb-1.5" style={{ color: tagData.color !== 'transparent' ? tagData.color : '#9CA3AF' }}>
                  {tagData.name}
              </p>
          )}
          <h3 className="font-heading font-bold text-xs md:text-sm text-black mb-1 uppercase leading-tight group-hover:text-[#B91C1C] transition-colors line-clamp-1">{product.name}</h3>
          <div className="flex justify-center"><PriceDisplay price={product.price} discountPrice={product.discountPrice} /></div>
        </div>
      </Link>
    </div>
  );
};