'use client'; // Needed for interactive filters/animations
import { useState, useEffect } from 'react';
import { getCategoryPageData } from '@/app/actions';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, ArrowRight } from 'lucide-react';

export default function CategoryPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    // Unwrap params properly for Next.js 15+ if needed, or use directly
    const slug = (await params).slug; 
    
    // Pass filters to server action
    const filterParams = { 
      search: searchQuery, 
      minPrice: priceRange.min, 
      maxPrice: priceRange.max 
    };
    
    const result = await getCategoryPageData(slug, filterParams);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [params]); // Initial load

  // Handle Search Submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchData(); // Refetch with new filters
  };

  if (loading) return <div className="min-h-screen pt-40 text-center">Loading Collection...</div>;
  if (!data) return <div className="min-h-screen pt-40 text-center">Category not found.</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope">
      <Navbar />

      {/* --- HEADER --- */}
      <div className="pt-32 pb-10 px-6 text-center bg-white border-b border-gray-100">
        <h1 className="font-bodoni text-5xl mb-3 capitalize">{data.mainCategory.name}</h1>
        <p className="text-gray-400 text-xs uppercase tracking-[0.2em]">
          {data.sections.length} Sub-Collections Available
        </p>

        {/* --- FILTER & SEARCH BAR --- */}
        <form onSubmit={handleFilterSubmit} className="mt-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder={`Search in ${data.mainCategory.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-black"
                />
            </div>

            {/* Price Filter Toggler */}
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-full hover:bg-black hover:text-white transition text-xs font-bold uppercase tracking-wide"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>

            {/* Apply Button */}
            <button type="submit" className="hidden md:block px-6 py-2 bg-black text-white rounded-full text-xs font-bold uppercase">
              Update
            </button>
        </form>

        {/* Expandable Filter Area */}
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden mt-4 max-w-lg mx-auto bg-gray-50 p-6 rounded-xl"
          >
             <div className="flex gap-4 items-center justify-center">
               <input 
                 placeholder="Min Price" 
                 type="number" 
                 className="p-2 border rounded w-24 text-center text-sm"
                 value={priceRange.min}
                 onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
               />
               <span className="text-gray-400">-</span>
               <input 
                 placeholder="Max Price" 
                 type="number" 
                 className="p-2 border rounded w-24 text-center text-sm"
                 value={priceRange.max}
                 onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
               />
               <button onClick={handleFilterSubmit} className="bg-black text-white px-4 py-2 rounded text-xs font-bold">Apply</button>
             </div>
          </motion.div>
        )}
      </div>

      {/* --- SECTIONS CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        
        {/* 1. Direct Products (If any exist in main category) */}
        {data.mainProducts.length > 0 && (
           <ProductSection title={`All ${data.mainCategory.name}`} products={data.mainProducts} />
        )}

        {/* 2. Sub-Category Sections */}
        {data.sections.map((section) => (
           section.products.length > 0 && (
             <ProductSection 
                key={section._id} 
                title={section.name} 
                products={section.products} 
                viewAllLink={`/category/sub/${section.slug}`} // You can create this route later if needed
             />
           )
        ))}

        {data.sections.every(s => s.products.length === 0) && data.mainProducts.length === 0 && (
           <div className="text-center py-20 text-gray-400">No products found in this category.</div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PRODUCT SECTION ---
function ProductSection({ title, products, viewAllLink }) {
  return (
    <div className="mt-16">
      <div className="flex justify-between items-end mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bodoni text-gray-900 capitalize">{title}</h2>
          <div className="h-0.5 w-12 bg-black mt-2"></div>
        </div>
        {/* 'See More' could just load more via JS or link to a specific filtered page */}
        <button className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
          See All <ArrowRight size={12} />
        </button>
      </div>

      {/* Horizontal Scroll / Grid for Mobile/Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        {products.map((product) => (
           <Link href={`/product/${product.slug}`} key={product._id} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-4">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Quick Add Button Animation */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur py-3 text-center border-t border-gray-100">
                   <span className="text-[10px] font-bold uppercase tracking-widest">View Details</span>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 group-hover:underline decoration-1 underline-offset-4">{product.name}</h3>
              <div className="flex gap-2 items-center mt-1">
                {product.discountPrice ? (
                    <>
                      <span className="text-xs font-bold text-red-600">৳{product.discountPrice}</span>
                      <span className="text-xs text-gray-400 line-through">৳{product.price}</span>
                    </>
                ) : (
                    <span className="text-xs font-bold text-gray-900">৳{product.price}</span>
                )}
              </div>
           </Link>
        ))}
      </div>
    </div>
  );
}