'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Check, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ✅ FIX: Import from your EXISTING Context
import { useCart } from '@/lib/context/CartContext';

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 14, className = "", weight = "bold" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block ${className}`}
    style={{ verticalAlign: 'middle', transform: 'translateY(-1px)' }} 
  >
    <text 
      x="50%" 
      y="58%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontSize="22" 
      fontWeight={weight === 'bold' ? 'bold' : 'normal'} 
      fill="currentColor" 
      style={{ fontFamily: "'Bodoni Moda', serif" }}
    >
      ৳
    </text>
  </svg>
);

export default function ProductCard({ product }) {
  const [showSizes, setShowSizes] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  
  // ✅ FIX: Get addToCart from your context
  const { addToCart } = useCart(); 

  if (!product) return null;

  // --- PRICE LOGIC ---
  const now = new Date();
  const isSaleActive = product.discountPrice && 
    product.discountPrice < product.price &&
    (!product.saleStartDate || new Date(product.saleStartDate) <= now) &&
    (!product.saleEndDate || new Date(product.saleEndDate) >= now);

  const currentPrice = isSaleActive ? product.discountPrice : product.price;
  const originalPrice = isSaleActive ? product.price : null;

  const format = (num) => new Intl.NumberFormat('en-BD', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(num || 0);

  // --- TAG LOGIC ---
  let displayTag = product.tags?.[0]?.name || product.tag;
  if (!displayTag) {
      if (isSaleActive) displayTag = "SALE";
      else if (new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) displayTag = "NEW";
  }

  // --- ADD TO CART HANDLER ---
  const handleAddToCart = (selectedVariant = null) => {
    try {
        // 1. Stock Verification
        const stockToCheck = selectedVariant ? selectedVariant.stock : product.stock;
        
        if (stockToCheck <= 0) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
            return;
        }

        // 2. Call Context Function
        // Your Context expects: addToCart(productObject, quantity, sizeString)
        const sizeToAdd = selectedVariant ? selectedVariant.size : null;
        addToCart(product, 1, sizeToAdd);

        // 3. Success Feedback
        setStatus('success');
        setTimeout(() => {
            setStatus('idle');
            setShowSizes(false);
        }, 1500);

    } catch (error) {
        console.error("Add to cart failed:", error);
        setStatus('error');
    }
  };

  // --- INTERACTION HANDLERS ---
  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If has variants, toggle overlay. Else add directly.
    if (product.variants && product.variants.length > 0) {
      setShowSizes(!showSizes);
    } else {
      handleAddToCart(null); 
    }
  };

  const handleSizeSelect = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(variant);
  };

  return (
    <div className="group block w-full h-full relative">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
        
        {/* IMAGE CONTAINER */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 mb-3">
            
            <Image 
                src={product.images?.[0] || '/placeholder.jpg'} 
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                loading="lazy" 
                quality={80}
            />

            {/* Overlay */}
            <div className={`absolute inset-0 bg-black/0 transition-colors duration-300 pointer-events-none ${showSizes ? 'bg-black/20' : 'group-hover:bg-black/5'}`}></div>

            {/* TAG */}
            {displayTag && (
                <div className="absolute top-0 left-0 p-2 md:p-3 z-10">
                    <span className={`backdrop-blur-md px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm ${displayTag === 'SALE' ? 'bg-[#B91C1C] text-white' : 'bg-white/95 text-[#B91C1C]'}`}>
                        {displayTag}
                    </span>
                </div>
            )}

            {/* --- SIZE SELECTOR OVERLAY --- */}
            <AnimatePresence>
                {showSizes && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-30 flex flex-col items-center gap-2"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                    >
                         <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Select Size</span>
                            <button onClick={(e) => { e.stopPropagation(); setShowSizes(false); }} className="text-gray-400 hover:text-black">
                                <X size={14} />
                            </button>
                         </div>
                         
                         {status === 'success' ? (
                             <div className="w-full py-2 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-sm">
                                <Check size={14} /> Added
                             </div>
                         ) : status === 'error' ? (
                             <div className="w-full py-2 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-sm">
                                <AlertCircle size={14} /> No Stock
                             </div>
                         ) : (
                             <div className="flex flex-wrap gap-2 justify-center w-full">
                                {product.variants?.map((variant) => (
                                    <button
                                        // Use combination of ID and Size for key to be safe
                                        key={`${variant.size}-${variant._id || 'v'}`} 
                                        onClick={(e) => handleSizeSelect(e, variant)}
                                        disabled={variant.stock <= 0}
                                        className={`h-8 min-w-[32px] px-2 text-[10px] font-bold border transition-colors
                                            ${variant.stock > 0 
                                                ? 'border-gray-200 hover:border-black hover:bg-black hover:text-white text-black' 
                                                : 'border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50'
                                            }
                                        `}
                                    >
                                        {variant.size}
                                    </button>
                                ))}
                             </div>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- QUICK ADD BUTTON --- */}
            {!showSizes && (
                <div className="absolute bottom-3 right-3 z-20 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300">
                    <button 
                        onClick={handleCartClick}
                        // Disable if global stock is 0 AND no variants exist
                        disabled={product.stock <= 0 && (!product.variants || product.variants.length === 0)}
                        className={`bg-white text-black w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-[#B91C1C] hover:text-white transition-colors shadow-xl
                           ${status === 'success' ? '!bg-green-600 !text-white' : ''}
                        `}
                        aria-label="Add to Cart"
                    >
                         {status === 'success' ? <Check size={16} /> : <ShoppingBag size={16} />}
                    </button>
                </div>
            )}
        </div>

        {/* INFO */}
        <div className="px-1 flex flex-col gap-1">
            <h3 className="font-heading font-bold text-sm text-gray-900 truncate group-hover:text-[#B91C1C] transition-colors">
                {product.name}
            </h3>

            <div className="flex items-end justify-between min-h-[36px]">
                <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider truncate max-w-[55%] mb-1">
                    {product.category?.name || "Collection"}
                </p>
                
                <div className="flex flex-col items-end leading-none">
                    {isSaleActive && (
                        <div className="flex items-center gap-[1px] text-[10px] text-neutral-400 line-through decoration-neutral-400 mb-1">
                            <Taka size={9} weight="normal" className="text-neutral-400" />
                            <span>{format(originalPrice)}</span>
                        </div>
                    )}
                    <div className={`flex items-center gap-[2px] font-heading font-bold text-black ${isSaleActive ? 'text-[#B91C1C] text-sm' : 'text-sm'}`}>
                        <Taka size={14} weight="bold" />
                        <span>{format(currentPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
        </Link>
    </div>
  );
}