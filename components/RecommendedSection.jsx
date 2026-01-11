'use client';

import { useEffect, useState } from 'react';
import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard'; 

export default function RecommendedSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        if (typeof getRecommendedProducts === 'function') {
           const data = await getRecommendedProducts();
           setProducts(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white font-sans border-t border-neutral-100">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#B91C1C] font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs">
             Curated For You
          </span>
          <h2 className="font-heading font-black text-4xl md:text-6xl text-black mt-3 uppercase tracking-tighter leading-none">
             Recommended
          </h2>
          <div className="w-10 h-[3px] bg-black mx-auto mt-4" />
        </div>

        {/* --- DESKTOP GRID --- */}
        <div className="hidden lg:grid grid-cols-5 gap-x-4 gap-y-10">
          {products.map((product) => (
             <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* --- MOBILE/TABLET SCROLL (Clean Snap) --- */}
        {/* Uses CSS snap for smooth paging without duplication glitches */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
           <div className="flex gap-4 pb-6">
             {products.map((product) => (
               <div key={product._id} className="snap-center min-w-[180px] w-[60vw] md:w-[40vw] flex-shrink-0">
                  <ProductCard product={product} />
               </div>
             ))}
             {/* Spacer for end of scroll */}
             <div className="w-2 flex-shrink-0" />
           </div>
        </div>

      </div>
    </section>
  );
}