'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';
import Image from 'next/image'; 
import { Minus, Plus, X, ArrowRight, ShoppingBag, Ticket, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';

// --- CUSTOM TAKA ICON (Updated) ---
const Taka = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size+2} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block align-middle ${className}`}
    style={{ transform: 'translateY(-2px)' }}
  >
    <text 
      x="50%" 
      y="58%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontSize="22" 
      fontWeight="bold" 
      fill="currentColor" 
      style={{ fontFamily: "bodoni" }} 
    >
      ৳
    </text>
  </svg>
);

// --- SUB-COMPONENT: CART ITEM ---
const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // 1. Safe Image Logic
  // Check if image is an array (from DB) or string (local)
  const rawImage = Array.isArray(item.images) ? item.images[0] : item.image;
  const imageUrl = rawImage || '/placeholder.jpg';

  // 2. Variant & Stock Logic
  const variantData = item.variants?.find(v => v.size === item.selectedSize);
  const stockLimit = variantData ? variantData.stock : (item.stock || 10);
  const isLowStock = stockLimit < 5 && stockLimit > 0;

  // 3. Price Logic
  const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
  const isOnSale = effectivePrice < item.price;

  // 4. Tag Logic (Fix)
  // Prioritize the 'tag' string sent from the backend (calculateCart), fallback to tags array
  const displayTag = item.tag || item.tags?.[0]?.name;

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, height: 0, marginBottom: 0 }} 
      className="group relative flex flex-col sm:flex-row gap-4 md:gap-6 py-6 border-b border-neutral-100 last:border-0"
    >
      {/* --- IMAGE SECTION (Optimized) --- */}
      <div className="flex gap-4 sm:block">
        <div className="w-20 sm:w-24 md:w-28 aspect-[3/4] bg-neutral-100 relative overflow-hidden shrink-0">
          <Image 
            src={imageUrl} 
            alt={item.name} 
            fill
            sizes="(max-width: 768px) 100px, 150px"
            quality={90}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Note: Overlay tag removed as requested to avoid duplication */}
        </div>
        
        {/* MOBILE: Delete Button */}
        <button 
          onClick={() => removeFromCart(item._id, item.selectedSize)} 
          className="sm:hidden text-neutral-400 hover:text-[#B91C1C] transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          {/* Title Row */}
          <div className="flex justify-between items-start mb-1">
            <Link href={`/product/${item.slug || '#'}`} className="font-heading font-black text-lg md:text-xl text-black uppercase tracking-tight leading-none hover:text-[#B91C1C] transition-colors line-clamp-2 pr-4">
              {item.name}
            </Link>
            {/* DESKTOP: Delete Button */}
            <button 
              onClick={() => removeFromCart(item._id, item.selectedSize)} 
              className="hidden sm:block text-neutral-300 hover:text-[#B91C1C] transition-colors p-1 -mr-2"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Metadata Row (Tags & Info) */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
              <span>{item.category?.name || 'Item'}</span>
              
              {/* Size Badge */}
              {item.selectedSize && (
                <>
                  <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                  <span className="text-black bg-neutral-100 px-1.5 py-0.5">
                    Size: {item.selectedSize}
                  </span>
                </>
              )}

               {/* Tag Badge (From DB) */}
               {displayTag && (
                <>
                  <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                  <span className="text-[#B91C1C] bg-neutral-100 px-1.5 py-0.5">
                    {displayTag}
                  </span>
                </>
              )}
          </div>

          {/* Barcode & Stock */}
          <div className="flex flex-col gap-2 mb-4">
             {item.barcode && (
               <div className="opacity-40 origin-left scale-75 sm:scale-90 grayscale">
                 <Barcode 
                   value={item.barcode} 
                   width={1.2} height={25} fontSize={10} 
                   displayValue={false} background="transparent" lineColor="#000" margin={0}
                 />
               </div>
             )}

             {isLowStock && (
                <span className="text-[9px] text-[#B91C1C] font-bold flex items-center gap-1">
                  <AlertTriangle size={10} className="fill-[#B91C1C]"/> Low Stock: Only {stockLimit} left
                </span>
             )}
          </div>

          {/* Controls & Price */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-neutral-100 sm:border-none">
              
              {/* Quantity */}
              <div className="flex items-center border border-neutral-200 h-8">
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity - 1)} 
                  className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity + 1)} 
                  disabled={item.quantity >= stockLimit}
                  className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Price Display */}
              <div className="text-right flex flex-col items-end">
                {isOnSale ? (
                   <>
                      <span className="text-sm font-bold text-[#B91C1C] flex items-center gap-0.5">
                        <Taka size={14} />{(effectivePrice * item.quantity).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 line-through flex items-center gap-0.5">
                        <Taka size={10} />{(item.price * item.quantity).toLocaleString()}
                      </span>
                   </>
                ) : (
                   <span className="text-sm font-bold flex items-center gap-0.5 text-black">
                     <Taka size={14} />{(effectivePrice * item.quantity).toLocaleString()}
                   </span>
                )}
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE ---
export default function CartClient() {
  const { 
    cart, removeFromCart, updateQuantity, 
    appliedCoupon, applyCouponCode, removeCoupon, manualCode, couponError 
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => { if(manualCode) setInputVal(manualCode); }, [manualCode]);
  useEffect(() => { setMounted(true); }, []);

  const handleApply = () => { if (inputVal.trim()) applyCouponCode(inputVal); };
  const handleRemove = () => { removeCoupon(); setInputVal(''); };

  // Calculate Totals Locally to avoid Context Delay Lag
  const localSubTotal = cart.reduce((acc, item) => {
      const price = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
      return acc + (price * item.quantity);
  }, 0);

  const localGrandTotal = localSubTotal - (appliedCoupon ? appliedCoupon.amount : 0);

  if (!mounted) return null;

  // --- EMPTY STATE ---
  if (cart.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans bg-white relative px-6 text-center">
      <div className="mb-6 p-6 rounded-full bg-neutral-50 border border-neutral-100">
        <ShoppingBag size={24} className="text-[#B91C1C]" strokeWidth={1.5} />
      </div>
      <h1 className="font-heading font-black text-3xl uppercase tracking-tight mb-2 text-black">Your Bag is Empty</h1>
      <p className="text-xs text-neutral-500 mb-8 uppercase tracking-widest">Start curating your wardrobe.</p>
      <Link href="/categories" className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#B91C1C] transition-colors">
        View Collections
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans relative pb-20">
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b-2 border-black pb-6">
           <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B91C1C] block mb-2">Cart Review</span>
              <h1 className="font-heading font-black text-5xl md:text-6xl text-black uppercase tracking-tighter leading-none">Shopping Bag</h1>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mt-4 md:mt-0">
             {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LEFT: Items List */}
          <div className="lg:col-span-7">
              <div className="flex flex-col gap-0">
                <AnimatePresence mode='popLayout'>
                  {cart.map((item) => (
                    <CartItem 
                      key={`${item._id}-${item.selectedSize}`} 
                      item={item} 
                      updateQuantity={updateQuantity} 
                      removeFromCart={removeFromCart} 
                    />
                  ))}
                </AnimatePresence>
              </div>
          </div>

          {/* RIGHT: Summary & Checkout */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="bg-neutral-50 p-6 md:p-8 border border-neutral-200">
              
              <h2 className="font-heading font-black text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
                Order Summary
              </h2>
              
              {/* COUPON SECTION */}
              <div className="mb-8">
                  {appliedCoupon && (
                    <div className="p-3 mb-4 flex justify-between items-center border border-[#B91C1C]/20 bg-white">
                      <div className="flex items-center gap-3">
                          {appliedCoupon.isAuto ? <Zap size={14} className="text-[#B91C1C]" /> : <Ticket size={14} className="text-black" />}
                          <div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-black block">
                                {appliedCoupon.isAuto ? "Auto Applied" : appliedCoupon.code}
                             </span>
                             <span className="text-[9px] font-bold text-[#B91C1C]">{appliedCoupon.desc}</span>
                          </div>
                       </div>
                       {!appliedCoupon.isAuto && (
                          <button onClick={handleRemove} className="text-neutral-400 hover:text-black transition-colors"><X size={14}/></button>
                       )}
                    </div>
                  )}

                  {(!appliedCoupon || appliedCoupon.isAuto) && (
                    <div className="flex gap-2">
                       <input 
                         value={inputVal}
                         onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                         placeholder="PROMO CODE"
                         className="flex-1 bg-white border border-neutral-200 py-3 px-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-black transition-colors placeholder-neutral-300"
                       />
                       <button 
                         onClick={handleApply}
                         disabled={!inputVal}
                         className="px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#B91C1C] disabled:opacity-50 disabled:hover:bg-black transition-colors"
                       >
                         Apply
                       </button>
                    </div>
                  )}
                  {couponError && <p className="text-[9px] text-[#B91C1C] mt-2 font-bold uppercase tracking-wide flex items-center gap-1"><AlertTriangle size={10}/> {couponError}</p>}
              </div>

              {/* CALCULATIONS */}
              <div className="space-y-3 mb-8 border-t border-dashed border-neutral-200 pt-6">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-neutral-500">
                  <span>Subtotal</span>
                  <span className="text-black flex items-center gap-1">
                    <Taka size={12} />{localSubTotal.toLocaleString()}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-[#B91C1C]">
                    <span>Discount</span>
                    <span className="flex items-center gap-1">
                      -<Taka size={12} />{appliedCoupon.amount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-neutral-500">
                  <span>Delivery</span>
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5">Calculated Next</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-end mb-8 pt-6 border-t-2 border-black">
                <span className="text-sm font-black uppercase tracking-widest text-black">Total</span>
                <span className="font-heading font-black text-3xl text-black leading-none flex items-center gap-1">
                   <Taka size={24} />{localGrandTotal.toLocaleString()}
                </span>
              </div>

              {/* ACTIONS */}
              <Link href="/checkout" className="group block w-full bg-[#B91C1C] text-white text-center py-4 text-[11px] font-black uppercase tracking-[0.25em] hover:bg-black transition-colors shadow-lg">
                 Secure Checkout <ArrowRight size={14} className="inline ml-2 mb-0.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/categories" className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-black border-b border-transparent hover:border-black transition-all">
                  Continue Shopping
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}