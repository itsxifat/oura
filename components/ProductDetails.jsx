'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Minus, Plus, ChevronRight, ShoppingBag, X, Ruler, ZoomIn, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext'; 
import gsap from 'gsap';

// --- ASSETS: Correct Taka SVG ---
const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

// --- COMPONENT: IMAGE LIGHTBOX ---
const ImageLightbox = ({ isOpen, onClose, images, initialIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  
  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-center items-center backdrop-blur-md animate-fade-in">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50">
        <X size={32} />
      </button>
      
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onDoubleClick={() => setScale(scale === 1 ? 2.5 : 1)} 
      >
        <img 
          src={images[currentIndex]} 
          alt="Zoom View" 
          className="max-w-[90vw] max-h-[80vh] object-contain transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      <div className="absolute bottom-10 flex gap-4 overflow-x-auto px-4 max-w-full">
        {images.map((img, idx) => (
          <button 
            key={idx} 
            onClick={() => { setCurrentIndex(idx); setScale(1); }}
            className={`w-16 h-16 border-2 transition-all ${currentIndex === idx ? 'border-[#D4AF37] opacity-100' : 'border-transparent opacity-50'}`}
          >
            <img src={img} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      
      <div className="absolute top-6 left-6 text-white/50 text-xs font-bold uppercase tracking-widest">
        Double Click to Zoom • {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

// --- COMPONENT: DYNAMIC SIZE GUIDE TABLE ---
const SizeGuideModal = ({ isOpen, onClose, sizeGuide }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
      <div className="bg-[#fffdf9] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl relative rounded-xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-black text-white p-5 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] block mb-1">Measurement Chart</span>
             <h3 className="text-lg font-bodoni text-white">{sizeGuide?.name || "Size Guide"}</h3>
          </div>
          <button onClick={onClose} className="hover:text-[#D4AF37] transition-colors"><X size={24}/></button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
          {sizeGuide && sizeGuide.columns && sizeGuide.rows && sizeGuide.rows.length > 0 ? (
             <div className="overflow-x-auto border border-gray-100 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                         {sizeGuide.columns.map((col, i) => (
                            <th key={i} className="p-4 font-bold text-black uppercase text-[10px] tracking-widest whitespace-nowrap min-w-[80px]">
                               {col}
                            </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 bg-white">
                      {sizeGuide.rows.map((row, rIdx) => (
                         <tr key={rIdx} className="hover:bg-[#fffdf5] transition-colors">
                            {row.values.map((val, cIdx) => (
                               <td key={cIdx} className={`p-4 whitespace-nowrap ${cIdx === 0 ? 'font-bold text-black' : 'text-gray-600 font-mono'}`}>
                                  {val}
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          ) : (
             <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <Ruler size={48} className="text-gray-200 mb-4" />
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">No chart data available</span>
             </div>
          )}
          
          <div className="mt-6 text-center">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">All measurements are in inches unless otherwise noted.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ProductDetails({ product }) {
  const router = useRouter();
  const { addToCart, cart } = useCart(); // Get cart to check existing quantity
  const containerRef = useRef(null);
  
  // State
  // 1. Data Parsing (Memoized to prevent recalc on every render)
  const variants = useMemo(() => 
    product.variants?.length > 0 
      ? product.variants 
      : (product.sizes || []).map(s => ({ size: s, stock: product.stock || 0 })), 
  [product]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // 2. Derived State & Validation Logic
  const currentVariant = variants.find(v => v.size === selectedSize);
  const maxStock = currentVariant ? currentVariant.stock : 0;
  const isOutOfStock = !currentVariant || maxStock <= 0;

  // Check how many are ALREADY in the cart for this specific variant
  const cartItem = cart.find(item => item._id === product._id && item.selectedSize === selectedSize);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  
  // Calculate remaining stock available to add
  const remainingStock = Math.max(0, maxStock - quantityInCart);

  // --- EFFECT: Reset Quantity on Size Change ---
  useEffect(() => {
    setQuantity(1); // Reset to 1 whenever size changes to prevent carrying over invalid qty
  }, [selectedSize]);

  // --- ANIMATIONS ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-mask", 
        { scaleY: 1.1, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
        { scaleY: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.2, ease: "power4.out" }
      );
      gsap.fromTo(".anim-content",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power2.out", delay: 0.3 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // --- ACTIONS ---
  const handleAddToCart = () => {
    if (!selectedSize && variants.length > 0) return alert("Please select a size");
    if (isOutOfStock) return alert("Selected size is out of stock");
    
    // STRICT CHECK: Ensure total quantity doesn't exceed stock
    if (quantity > remainingStock) {
        return alert(`Sorry, you already have ${quantityInCart} in your cart. Only ${remainingStock} more available.`);
    }

    setIsAdding(true);
    addToCart(product, quantity, selectedSize);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    if (!selectedSize && variants.length > 0) return alert("Please select a size");
    if (isOutOfStock) return alert("Selected size is out of stock");
    
    if (quantity > remainingStock) {
        return alert(`Sorry, only ${remainingStock} available.`);
    }

    addToCart(product, quantity, selectedSize);
    router.push('/cart');
  };

  const incrementQuantity = () => {
      setQuantity(prev => Math.min(remainingStock, prev + 1));
  };

  const decrementQuantity = () => {
      setQuantity(prev => Math.max(1, prev - 1));
  };

  if (!product) return null;

  return (
    <main ref={containerRef} className="pt-4 pb-20 font-manrope bg-[#faf9f6] text-black">
      
      {/* BREADCRUMBS */}
      <div className="max-w-[1200px] mx-auto px-6 mb-6 anim-content opacity-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link href="/products" className="hover:text-black transition-colors">Shop</Link>
          <ChevronRight size={10} />
          <span className="text-[#D4AF37] border-b border-[#D4AF37] pb-0.5 line-clamp-1">{product.name}</span>
        </div>
      </div>

      {/* LAYOUT GRID */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* --- LEFT: GALLERY --- */}
        <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 sticky top-24">
          
          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:h-[70vh] scrollbar-hide shrink-0 pb-2 lg:pb-0 anim-content">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-16 h-20 lg:w-20 lg:h-24 shrink-0 border transition-all ${activeImage === idx ? 'border-[#D4AF37] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 relative anim-mask bg-gray-100 cursor-zoom-in group" onClick={() => setLightboxOpen(true)}>
            <img 
              src={product.images?.[activeImage] || '/placeholder.jpg'} 
              alt={product.name} 
              className="w-full h-auto object-cover aspect-[3/4] lg:aspect-auto lg:h-[80vh]"
            />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {product.discountPrice && (
                <span className="bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 shadow-md">Sale</span>
              )}
              {maxStock < 5 && maxStock > 0 && selectedSize && (
                <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 shadow-md animate-pulse">
                  Low Stock
                </span>
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur text-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn size={18} />
            </div>
          </div>
        </div>

        {/* --- RIGHT: DETAILS --- */}
        <div className="lg:col-span-5 pt-2">
          
          {/* Header Info */}
          <div className="anim-content opacity-0 border-b border-gray-200 pb-6 mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3 block">
              {product.category?.name || 'Exclusive'}
            </span>
            <h1 className="font-bodoni text-4xl lg:text-5xl text-black leading-none tracking-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-medium font-bodoni text-black flex items-center gap-1">
                  <Taka size={22} weight="bold"/>
                  {product.discountPrice ? product.discountPrice.toLocaleString() : product.price.toLocaleString()}
                </span>
                {product.discountPrice && (
                  <span className="text-lg text-gray-400 line-through font-manrope flex items-center decoration-1">
                    <Taka size={14} />{product.price.toLocaleString()}
                  </span>
                )}
              </div>
              
              {product.reviews && product.reviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < Math.round(product.rating || 5) ? "currentColor" : "none"} className={i >= Math.round(product.rating || 5) ? "text-gray-300" : ""} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2 border-b border-gray-200">
                    {product.reviews.length} Reviews
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Size Selector */}
          <div className="anim-content opacity-0 mb-10">
            {variants.length > 0 && (
              <>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Select Size</span>
                  
                  {/* SIZE GUIDE TRIGGER */}
                  {product.sizeGuide && (
                      <button 
                        onClick={() => setShowSizeGuide(true)}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 hover:text-[#D4AF37] transition-colors border-b border-transparent hover:border-[#D4AF37] pb-0.5"
                      >
                        <Ruler size={14} /> Size Guide
                      </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {variants.map((v) => {
                    const isOOS = v.stock <= 0;
                    return (
                      <button
                        key={v.size}
                        disabled={isOOS}
                        onClick={() => setSelectedSize(v.size)}
                        className={`h-12 border flex items-center justify-center text-xs font-bold transition-all relative group ${
                          isOOS 
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : selectedSize === v.size
                              ? 'bg-black text-white border-black shadow-lg scale-105'
                              : 'bg-white border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                        }`}
                      >
                        {v.size}
                        {isOOS && <div className="absolute w-full h-[1px] bg-gray-300 -rotate-45" />}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 h-5 text-[10px] uppercase tracking-widest font-bold">
                  {selectedSize ? (
                    remainingStock <= 0 ? (
                        quantityInCart > 0 
                            ? <span className="text-red-500">Max limit reached (You have {quantityInCart} in cart)</span>
                            : <span className="text-gray-400">Out of Stock</span>
                    ) : (
                        maxStock < 5 ? <span className="text-red-600 animate-pulse">Hurry! Only {remainingStock} Left</span> :
                        <span className="text-green-700 flex items-center gap-1"><Check size={12}/> In Stock</span>
                    )
                  ) : (
                    <span className="text-gray-400">Please select a size</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Buttons & Quantity */}
          <div className="anim-content opacity-0 flex flex-col gap-4 mb-10">
            <div className="flex gap-4 h-14">
              <div className="w-32 flex items-center border border-gray-200 bg-white">
                <button 
                    onClick={decrementQuantity} 
                    className="h-full w-10 flex items-center justify-center hover:bg-gray-50"
                    disabled={!selectedSize || remainingStock === 0}
                >
                    <Minus size={14}/>
                </button>
                <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                <button 
                    onClick={incrementQuantity} 
                    className="h-full w-10 flex items-center justify-center hover:bg-gray-50"
                    disabled={!selectedSize || quantity >= remainingStock}
                >
                    <Plus size={14}/>
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={isAdding || !selectedSize || remainingStock === 0}
                className="flex-1 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
              >
                {isAdding ? "Adding..." : <><ShoppingBag size={16} /> Add to Bag</>}
              </button>
            </div>

            <button 
              onClick={handleBuyNow}
              disabled={!selectedSize || remainingStock === 0}
              className="w-full h-14 border border-black bg-transparent hover:bg-black hover:text-white transition-all text-[11px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
            >
              Buy It Now
            </button>
          </div>

          {/* Description */}
          <div className="anim-content opacity-0 border-t border-gray-200 pt-8 mb-10">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Description</h3>
              <p className="text-sm text-gray-600 leading-7 font-manrope whitespace-pre-line">
                {product.description || "Expertly crafted with attention to detail."}
              </p>
          </div>

          {/* Reviews */}
          <div className="anim-content opacity-0 border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]">Reviews ({product.reviews?.length || 0})</h3>
              {product.reviews?.length > 0 && (
                <div className="flex text-[#D4AF37] text-xs">
                  <Star size={12} fill="currentColor" /> 
                  <span className="ml-1 text-black font-bold">{(product.reviews.reduce((a,b)=>a+b.rating,0)/product.reviews.length).toFixed(1)}</span>
                </div>
              )}
            </div>

            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {product.reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold">{review.user}</span>
                      <div className="flex text-[#D4AF37]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                    <span className="text-[9px] text-gray-400 mt-2 block">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 mb-2">No reviews yet.</p>
                <button className="text-[10px] font-bold uppercase tracking-widest text-black underline">Be the first to write one</button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}
      <ImageLightbox 
        isOpen={isLightboxOpen} 
        onClose={() => setLightboxOpen(false)} 
        images={product.images || []} 
        initialIndex={activeImage} 
      />

      <SizeGuideModal 
        isOpen={showSizeGuide} 
        onClose={() => setShowSizeGuide(false)} 
        // Pass the FULL sizeGuide object (columns/rows) from database
        sizeGuide={product.sizeGuide} 
      />

    </main>
  );
}