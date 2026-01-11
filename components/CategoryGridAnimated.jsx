'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.05, 
      ease: "easeOut"
    }
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
};

// --- CARD COMPONENT ---
const CategoryCard = ({ category }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      exit="exit"
      className="w-full relative" // Removed h-full to prevent stretching
    >
      <Link 
        href={`/category/${category.slug}`} 
        // CHANGED: aspect-[4/5] and removed h-full. The block will size based on width.
        className="group relative block w-full overflow-hidden bg-neutral-900 aspect-[4/5]"
      >
        {/* 1. IMAGE LAYER */}
        <div className="relative w-full h-full bg-neutral-800">
          {category.image ? (
            <Image 
              src={category.image} 
              alt={category.name} 
              fill 
              className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105 opacity-90 group-hover:opacity-100"
              sizes="(max-width: 768px) 50vw, 20vw"
              loading="lazy"
              quality={75} 
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
               <span className="font-heading text-2xl text-neutral-700 font-black">OURA</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-70" />
        </div>

        {/* 2. CONTENT LAYER */}
        <div className="absolute inset-0 p-4 md:p-6 2xl:p-8 flex flex-col justify-between z-10 pointer-events-none">
           {/* Desktop Icon (Hidden on Mobile) */}
           <div className="flex justify-end w-full opacity-0 md:opacity-100">
              <div className="hidden md:flex w-9 h-9 rounded-full border border-white/20 items-center justify-center bg-black/20 backdrop-blur-sm group-hover:bg-[#B91C1C] group-hover:border-[#B91C1C] transition-all duration-300">
                 <ArrowUpRight size={16} className="text-white group-hover:rotate-45 transition-transform duration-300" />
              </div>
           </div>

           {/* Title & Line */}
           <div className="transform md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-heading font-black text-xl md:text-3xl text-white uppercase tracking-tight leading-none mb-2 drop-shadow-md">
                {category.name}
              </h3>
              {/* Line: Always visible on Mobile, Expands on Desktop */}
              <div className="h-[3px] bg-[#B91C1C] transition-all duration-300 ease-out w-8 md:w-0 md:group-hover:w-10" />
           </div>
        </div>

        {/* 3. BORDER HIGHLIGHT */}
        <div className="absolute inset-0 border-2 border-transparent md:group-hover:border-[#B91C1C]/20 transition-colors duration-300 pointer-events-none" />
      </Link>
    </motion.div>
  );
};

export default function CategoryGridAnimated({ categories }) {
  const [startIndex, setStartIndex] = useState(0);
  const MOBILE_LIMIT = 4;
  
  // FIX: Only enable cycling logic if we actually have more items than the limit
  const shouldCycle = categories && categories.length > MOBILE_LIMIT;

  // --- MOBILE AUTO-CYCLE LOGIC ---
  useEffect(() => {
    if (!shouldCycle) return;

    // Check if mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => {
        const nextIndex = prev + MOBILE_LIMIT;
        // Loop back to 0 if we reach the end
        if (nextIndex >= categories.length) {
          return 0; 
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [shouldCycle, categories.length]);

  if (!categories || categories.length === 0) return null;

  // FIX: Logic for determining what to show on mobile
  const getMobileItems = () => {
    // 1. If we have 4 or fewer items, just return them all (No repetition)
    if (!shouldCycle) {
      return categories;
    }

    // 2. If we have more than 4, slice the specific batch based on startIndex
    return categories.slice(startIndex, startIndex + MOBILE_LIMIT);
  };

  const mobileItems = getMobileItems();

  return (
    <div className="w-full">
      
      {/* --- DESKTOP GRID (Show First 8) --- */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {categories.slice(0, 8).map((cat, index) => (
          <CategoryCard key={cat._id} category={cat} index={index} />
        ))}
      </div>

      {/* --- MOBILE GRID --- */}
      {/* items-start ensures cards don't stretch vertically if they are fewer than row height */}
      <div className={`grid md:hidden grid-cols-2 gap-2 items-start ${shouldCycle ? 'min-h-[400px]' : ''}`}> 
        <AnimatePresence mode="wait">
          <motion.div
             // Key triggers re-render animation ONLY when index changes (cycling)
             key={shouldCycle ? startIndex : 'static'}
             className="col-span-2 grid grid-cols-2 gap-2"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.5 }}
          >
            {mobileItems.map((cat, index) => (
              <CategoryCard 
                key={cat._id}
                category={cat} 
                index={index} 
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Progress Indicators (Only show if we are actually cycling) */}
      {shouldCycle && (
        <div className="flex md:hidden justify-center gap-2 mt-6">
           {Array.from({ length: Math.ceil(categories.length / MOBILE_LIMIT) }).map((_, i) => (
              <div 
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  Math.floor(startIndex / MOBILE_LIMIT) === i ? 'w-8 bg-[#B91C1C]' : 'w-2 bg-gray-200'
                }`}
              />
           ))}
        </div>
      )}

    </div>
  );
}