'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';
import { Minus, Plus, X, ArrowRight, ShoppingBag, Ticket, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 16, className = "" }) => (
  <svg width={size} height={size+4} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

// --- SUB-COMPONENT: PREMIUM CART ITEM ---
const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // Safe Image Logic
  const imageUrl = (Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : (typeof item.image === 'string' ? item.image : '/placeholder.jpg');

  // Variant Logic
  const variantData = item.variants?.find(v => v.size === item.selectedSize);
  const stockLimit = variantData ? variantData.stock : (item.stock || 10);
  const isLowStock = stockLimit < 5 && stockLimit > 0;

  // --- PRICE LOGIC FIX ---
  // Use discountPrice if valid, otherwise base price
  const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
  const isOnSale = effectivePrice < item.price;

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="group relative flex flex-col sm:flex-row gap-4 md:gap-8 py-6 md:py-8 border-b border-gray-100 last:border-0"
    >
      {/* 1. IMAGE SECTION */}
      <div className="flex gap-4 sm:block">
        <div className="w-20 sm:w-24 md:w-32 aspect-[3/4] bg-[#f5f5f5] relative overflow-hidden shadow-sm shrink-0">
          <img 
            src={imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => e.target.src = '/placeholder.jpg'}
          />
          {isOnSale && (
             <div className="absolute top-0 left-0 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest">Sale</div>
          )}
        </div>
        
        {/* MOBILE: Delete Button */}
        <button 
          onClick={() => removeFromCart(item._id, item.selectedSize)} 
          className="sm:hidden text-gray-300 hover:text-red-600 transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* 2. DETAILS SECTION */}
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <div className="flex justify-between items-start mb-1">
            <Link href={`/product/${item.slug || '#'}`} className="font-bodoni text-lg md:text-2xl text-black leading-tight hover:text-[#D4AF37] transition-colors line-clamp-2 pr-4">
              {item.name}
            </Link>
            {/* DESKTOP: Delete Button */}
            <button 
              onClick={() => removeFromCart(item._id, item.selectedSize)} 
              className="hidden sm:block text-gray-300 hover:text-red-600 transition-colors p-1 -mr-2"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* METADATA ROW */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-gray-500 mb-3">
             <span>{item.category?.name || 'Collection'}</span>
             
             {/* SKU */}
             {item.sku && (
               <>
                 <span className="w-[1px] h-3 bg-gray-300"></span>
                 <span className="font-mono text-gray-700"> {item.sku}</span>
               </>
             )}

             {/* SIZE BADGE */}
             {item.selectedSize && (
                <span className="bg-black text-white px-2 py-0.5 rounded-sm font-bold ml-1">
                  Size: {item.selectedSize}
                </span>
             )}
          </div>

          {/* BARCODE & STOCK WARNING */}
          <div className="flex flex-col gap-2 mb-4">
             {/* Scannable Barcode */}
             {item.barcode && (
               <div className="opacity-80 mix-blend-multiply origin-left scale-90 sm:scale-100">
                 <Barcode 
                   value={item.barcode} 
                   width={1.2} 
                   height={30} 
                   fontSize={10} 
                   displayValue={true} 
                   background="transparent" 
                   lineColor="#000000"
                   margin={0}
                 />
               </div>
             )}

             {isLowStock && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit">
                  <AlertTriangle size={12}/> Only {stockLimit} items left
                </span>
             )}
          </div>

          {/* CONTROLS ROW */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 sm:border-none">
              {/* Quantity Control */}
              <div className="flex items-center border border-gray-200 h-8 bg-white">
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity - 1)} 
                  className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity + 1)} 
                  disabled={item.quantity >= stockLimit}
                  className="w-8 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Price Calculation */}
              <div className="text-right flex flex-col items-end">
                {isOnSale ? (
                   <>
                      <span className="text-sm md:text-base font-bold text-[#D4AF37] flex items-center gap-0.5">
                        <Taka size={14} />{(effectivePrice * item.quantity).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 line-through flex items-center gap-0.5">
                        <Taka size={10} />{(item.price * item.quantity).toLocaleString()}
                      </span>
                   </>
                ) : (
                   <span className="text-sm md:text-base font-bold flex items-center gap-0.5 text-black">
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
    cartTotal, grandTotal, appliedCoupon, 
    applyCouponCode, removeCoupon, manualCode, couponError 
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => { if(manualCode) setInputVal(manualCode); }, [manualCode]);
  useEffect(() => { setMounted(true); }, []);

  const handleApply = () => { if (inputVal.trim()) applyCouponCode(inputVal); };
  const handleRemove = () => { removeCoupon(); setInputVal(''); };

  // --- RECALCULATE TOTALS LOCALLY TO ENSURE DISPLAY ACCURACY ---
  // Ideally this should come from context, but doing it here guarantees the UI reflects the fix immediately
  const localSubTotal = cart.reduce((acc, item) => {
      const price = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
      return acc + (price * item.quantity);
  }, 0);

  const localGrandTotal = localSubTotal - (appliedCoupon ? appliedCoupon.amount : 0);

  if (!mounted) return null;

  // --- EMPTY STATE ---
  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center font-manrope bg-[#faf9f6] relative overflow-hidden px-4 text-center">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
      <div className="mb-6 md:mb-8 p-6 md:p-8 rounded-full bg-white shadow-xl animate-float">
        <ShoppingBag size={32} className="text-[#D4AF37]" strokeWidth={1} />
      </div>
      <h1 className="font-bodoni text-3xl md:text-4xl mb-4 text-black italic">Your Bag is Empty</h1>
      <Link href="/product" className="group relative px-8 py-4 bg-black text-white overflow-hidden shadow-lg hover:shadow-xl transition-all mt-4">
        <div className="absolute inset-0 bg-[#D4AF37] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></div>
        <span className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">Explore Collection</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope relative pb-20">
      <div className="absolute top-0 left-0 w-full h-[200px] md:h-[300px] bg-white shadow-sm -z-0"></div>
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 border-b border-gray-100 pb-6 md:pb-8">
           <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] block mb-2">The Collection</span>
              <h1 className="font-bodoni text-4xl md:text-5xl text-black">Shopping Bag</h1>
           </div>
           <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mt-4 md:mt-0">
             {cart.length} {cart.length === 1 ? 'Item' : 'Items'} Reserved
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-start">
          
          {/* LEFT: Items List */}
          <div className="lg:col-span-7">
              <div className="bg-white p-4 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/50 rounded-lg">
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
            <div className="bg-white p-6 md:p-10 border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

              <h2 className="font-bodoni text-2xl mb-8 flex items-center gap-3">
                <Sparkles size={16} className="text-[#D4AF37]" /> Order Summary
              </h2>
              
              {/* COUPON SECTION */}
              <div className="mb-10">
                  {appliedCoupon && (
                    <div className={`p-4 mb-4 flex justify-between items-center border rounded-md ${appliedCoupon.isAuto ? 'bg-[#F0F7FF] border-[#E0F0FF]' : 'bg-[#fffdf5] border-[#D4AF37]/20'}`}>
                      <div className="flex items-center gap-3">
                          {appliedCoupon.isAuto ? <Zap size={16} className="text-blue-500" /> : <Ticket size={16} className="text-[#D4AF37]" />}
                          <div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-black block">
                                {appliedCoupon.isAuto ? "Auto Offer" : appliedCoupon.code}
                             </span>
                             <span className="text-[10px] text-gray-500">{appliedCoupon.desc}</span>
                          </div>
                       </div>
                       {!appliedCoupon.isAuto && (
                          <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                       )}
                    </div>
                  )}

                  {(!appliedCoupon || appliedCoupon.isAuto) && (
                    <div className="relative group">
                       <input 
                         value={inputVal}
                         onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                         placeholder=" "
                         className="peer w-full bg-transparent border-b border-gray-200 py-3 pr-20 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-colors bg-gray-50/50 px-2 rounded-t"
                       />
                       <label className="absolute left-2 top-3 text-[10px] uppercase tracking-widest text-gray-400 transition-all peer-focus:-top-2 peer-focus:text-[8px] peer-focus:text-[#D4AF37] peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-[8px] pointer-events-none">
                         Promo Code
                       </label>
                       <button 
                         onClick={handleApply}
                         disabled={!inputVal}
                         className="absolute right-0 bottom-2 text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1"
                       >
                         Apply
                       </button>
                    </div>
                  )}
                  {couponError && <p className="text-[10px] text-red-500 mt-2 font-medium tracking-wide flex items-center gap-1"><X size={10}/> {couponError}</p>}
              </div>

              {/* TOTALS */}
              <div className="space-y-4 mb-8 border-b border-gray-100 pb-8 border-dashed">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-black flex items-center gap-1">
                    {/* Use Local Calculation for Display Accuracy */}
                    <Taka size={12} />{localSubTotal.toLocaleString()}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-[#D4AF37]">
                    <span className="font-medium">Discount Applied</span>
                    <span className="font-bold flex items-center gap-1">
                      -<Taka size={12} />{appliedCoupon.amount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Estimated Delivery</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Calculated at Checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-black">Total</span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 mb-1">BDT</span>
                  <span className="font-bodoni text-4xl text-black leading-none flex items-center gap-1">
                    {/* Use Local Calculation for Display Accuracy */}
                    <Taka size={28} />{localGrandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CHECKOUT BUTTON */}
              <Link href="/checkout" className="group relative w-full h-14 bg-black overflow-hidden flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_ease-in-out_infinite]" />
                <span className="relative z-10 text-white text-[11px] font-bold uppercase tracking-[0.25em] group-hover:text-[#D4AF37] transition-colors flex items-center gap-3">
                  Secure Checkout <ArrowRight size={14} />
                </span>
              </Link>
              
              <div className="mt-6 text-center">
                <Link href="/product" className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">
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