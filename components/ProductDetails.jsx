'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Minus, Plus, ChevronRight, ShoppingBag, X, Ruler, ZoomIn, Check, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext'; 
import Image from 'next/image'; 
import gsap from 'gsap';

// --- HELPERS ---
const cleanName = (name) => {
  if (!name) return "Verified Buyer";
  const parts = name.trim().split(/\s+/);
  return parts.filter((word, index) => word.toLowerCase() !== (parts[index - 1] || '').toLowerCase()).join(' ');
};

const getInitials = (name) => {
  const clean = cleanName(name);
  return clean.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

// --- TOAST ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-5 duration-300 ${type === 'error' ? 'bg-[#B91C1C] text-white' : 'bg-black text-white'}`}>
      {type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
      <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
    </div>
  );
};

// --- LIGHTBOX ---
const ImageLightbox = ({ isOpen, onClose, images, initialIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const touchStartDist = useRef(0);
  const startScale = useRef(1);

  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastTranslate.current = { x: 0, y: 0 };
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === '+' || e.key === '=') handleManualZoom(0.5);
      if (e.key === '-') handleManualZoom(-0.5);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]);

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleManualZoom = (delta) => {
    const newScale = Math.max(1, Math.min(4, scale + delta));
    setScale(newScale);
    if (newScale === 1) setTranslate({ x: 0, y: 0 });
  };

  const handleZoom = (clientX, clientY) => {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      lastTranslate.current = { x: 0, y: 0 };
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left - rect.width / 2;
      const offsetY = clientY - rect.top - rect.height / 2;
      const zoomFactor = 2.5;
      const newX = -offsetX * (zoomFactor - 1);
      const newY = -offsetY * (zoomFactor - 1);
      setScale(zoomFactor);
      setTranslate({ x: newX, y: newY });
      lastTranslate.current = { x: newX, y: newY };
    }
  };

  const onDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
        handleZoom(e.clientX, e.clientY);
    }
    lastTap.current = now;
  };

  const handlePointerDown = (e) => {
    if (scale === 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || scale === 1) return;
    e.preventDefault(); 
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: lastTranslate.current.x + dx, y: lastTranslate.current.y + dy });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    lastTranslate.current = translate;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStartDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      startScale.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const ratio = dist / touchStartDist.current;
      const newScale = Math.max(1, Math.min(4, startScale.current * ratio));
      setScale(newScale);
      if (newScale === 1) {
          setTranslate({ x: 0, y: 0 });
          lastTranslate.current = { x: 0, y: 0 };
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/98 flex flex-col justify-center items-center backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden" style={{ touchAction: 'none' }}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white p-2 z-50 transition-colors"><X size={32} /></button>
      
      {scale === 1 && (
        <>
            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors"><ChevronLeft size={48} /></button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors"><ChevronRight size={48} /></button>
        </>
      )}

      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={onDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <img 
          src={images[currentIndex]} 
          alt="Zoom View" 
          className={`max-w-[95vw] max-h-[85vh] object-contain select-none ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
          style={{ 
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-10 flex gap-2 z-50 pointer-events-none">
        {images.map((_, idx) => (
          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-150' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
};

// --- SIZE GUIDE ---
const SizeGuideModal = ({ isOpen, onClose, sizeGuide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-xl max-h-[80vh] overflow-hidden shadow-2xl rounded-sm flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-[#0a0a0a] text-white p-5 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-heading font-black uppercase tracking-widest">{sizeGuide?.name || "Size Chart"}</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {sizeGuide?.rows?.length > 0 ? (
             <table className="w-full text-sm text-left border-collapse">
                <thead>
                   <tr className="bg-neutral-50 border-b border-neutral-200">
                      {sizeGuide.columns.map((col, i) => <th key={i} className="p-3 font-bold text-black uppercase text-[10px] tracking-widest">{col}</th>)}
                   </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                   {sizeGuide.rows.map((row, rIdx) => (
                      <tr key={rIdx}><td className="p-3 font-bold">{row.values[0]}</td>{row.values.slice(1).map((v,c)=><td key={c} className="p-3 text-neutral-600">{v}</td>)}</tr>
                   ))}
                </tbody>
             </table>
          ) : <p className="text-center text-neutral-400 text-sm">No size information available.</p>}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ProductDetails({ product, orderCount = 0 }) {
  const router = useRouter();
  const { addToCart, cart } = useCart(); 
  const containerRef = useRef(null);
  const sizeSelectorRef = useRef(null);
  
  const variants = useMemo(() => product.variants?.length > 0 ? product.variants : (product.sizes || []).map(s => ({ size: s, stock: product.stock || 0 })), [product]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  
  const [toast, setToast] = useState(null); 
  const [sizeError, setSizeError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  const currentVariant = variants.find(v => v.size === selectedSize);
  const maxStock = currentVariant ? currentVariant.stock : 0;
  const isOutOfStock = !currentVariant || maxStock <= 0;
  
  const cartItem = cart.find(item => item._id === product._id && item.selectedSize === selectedSize);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, maxStock - quantityInCart);

  // --- 🏷️ ROBUST TAG LOGIC (With Safety Fallbacks) ---
  const tagData = useMemo(() => {
      // 1. Priority: Database Tag
      if (product.tags && product.tags.length > 0) {
          const t = product.tags[0];
          // Ensure it's a valid object with a name
          if (t && typeof t === 'object' && t.name) {
              return { 
                  name: t.name, 
                  color: t.color && t.color !== '#ffffff' ? t.color : '#B91C1C' // Fallback if white/empty
              };
          }
      }
      // 2. Fallback: On Sale
      if (product.discountPrice) {
          return { name: "SALE", color: '#B91C1C' }; // Brand Red
      }
      return null;
  }, [product]);

  useEffect(() => { setQuantity(1); setSizeError(false); }, [selectedSize]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-mask", { scale: 1.05, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" });
      gsap.fromTo(".anim-content", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, delay: 0.1 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const showToast = (msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const validateSelection = () => {
      if (!selectedSize && variants.length > 0) {
          setSizeError(true);
          showToast("Please select a size", "error");
          if(sizeSelectorRef.current) gsap.fromTo(sizeSelectorRef.current, { x: -5 }, { x: 0, duration: 0.1, repeat: 5, yoyo: true });
          return false;
      }
      if (quantity > remainingStock) {
          showToast(`Only ${remainingStock} items available`, "error");
          return false;
      }
      return true;
  };

  const incrementQuantity = () => {
      if (!validateSelection()) return;
      setQuantity(prev => Math.min(remainingStock, prev + 1));
  };

  const decrementQuantity = () => {
      if (!validateSelection()) return;
      setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    setIsAdding(true);
    addToCart(product, quantity, selectedSize);
    showToast("Added to bag", "success");
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    addToCart(product, quantity, selectedSize);
    router.push('/cart');
  };

  if (!product) return null;
  const avgRating = product.reviews?.length > 0 ? (product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length).toFixed(1) : 0;

  return (
    <main ref={containerRef} className="pt-4 pb-20 font-sans bg-white text-black min-h-screen">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-[1100px] mx-auto px-6 mb-6 anim-content opacity-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
          <Link href="/" className="hover:text-black">Home</Link> <ChevronRight size={10} />
          <Link href="/product" className="hover:text-black">Shop</Link> <ChevronRight size={10} />
          <span className="text-[#B91C1C] line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* LEFT: GALLERY */}
        <div className="lg:col-span-6 flex flex-col-reverse lg:flex-row gap-4 lg:sticky lg:top-24">
          {product.images?.length > 1 && (
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:h-[60vh] scrollbar-hide shrink-0 pb-2 lg:pb-0 anim-content">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(idx)} className={`relative w-14 h-16 lg:w-16 lg:h-20 shrink-0 border transition-all ${activeImage === idx ? 'border-[#B91C1C] ring-1 ring-[#B91C1C]' : 'border-neutral-200 opacity-60'}`}>
                  <Image src={img} fill className="object-cover" alt="thumb" sizes="64px" />
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 relative anim-mask bg-neutral-50 overflow-hidden cursor-zoom-in group aspect-[4/5] shadow-sm border border-neutral-100" onClick={() => setLightboxOpen(true)}>
            <Image 
              src={product.images?.[activeImage] || '/placeholder.jpg'} 
              alt={product.name} 
              fill
              className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
              priority
              quality={95}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            
            {/* 🏷️ DYNAMIC TAG DISPLAY */}
            {tagData && (
                <span 
                    className="absolute top-0 left-0 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 z-10 shadow-sm"
                    style={{ backgroundColor: tagData.color }}
                >
                    {tagData.name}
                </span>
            )}

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg">
              <ZoomIn size={18} />
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="lg:col-span-6 pt-2">
          
          <div className="anim-content opacity-0 border-b border-neutral-100 pb-6 mb-6">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#B91C1C] mb-2 block">{product.category?.name || 'Exclusive'}</span>
            <h1 className="font-heading font-black text-3xl lg:text-4xl text-black leading-tight mb-4 uppercase">{product.name}</h1>
            
            {orderCount > 0 && (
                <div className="mb-4 inline-flex items-center gap-2 bg-[#fffdf5] border border-[#D4AF37] px-3 py-1.5 rounded-sm">
                    <ShoppingBag size={12} className="text-[#D4AF37]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Purchased {orderCount} time{orderCount > 1 ? 's' : ''}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold font-heading text-black flex items-center gap-1"><Taka size={20} weight="bold"/> {product.discountPrice?.toLocaleString() || product.price.toLocaleString()}</span>
                {product.discountPrice && <span className="text-sm text-neutral-400 line-through"><Taka size={12} />{product.price.toLocaleString()}</span>}
              </div>
              {product.reviews?.length > 0 && (
                <div className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 border border-neutral-200">
                  <div className="flex text-[#B91C1C]"><Star size={10} fill="currentColor" strokeWidth={0} /></div>
                  <span className="text-xs font-bold">{avgRating}</span>
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider pl-1.5 border-l border-neutral-300">{product.reviews.length} Reviews</span>
                </div>
              )}
            </div>
          </div>

          <div className="anim-content opacity-0 mb-8" ref={sizeSelectorRef}>
            {variants.length > 0 && (
              <>
                <div className="flex justify-between items-end mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${sizeError ? 'text-red-600' : 'text-black'}`}>Select Size {sizeError && "*"}</span>
                  {product.sizeGuide && <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-1 text-[10px] uppercase font-bold text-neutral-400 hover:text-[#B91C1C] transition-colors"><Ruler size={12} /> Size Guide</button>}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {variants.map((v) => {
                    const isOOS = v.stock <= 0;
                    const isSelected = selectedSize === v.size;
                    return (
                      <button key={v.size} disabled={isOOS} onClick={() => setSelectedSize(v.size)}
                        className={`h-11 border flex items-center justify-center text-xs font-bold transition-all duration-200 ${isOOS ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed' : isSelected ? 'bg-black text-white border-black shadow-md scale-[1.02]' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'} ${sizeError && !selectedSize ? 'border-red-200 bg-red-50 text-red-500' : ''}`}>
                        {v.size}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 h-4 text-[9px] uppercase tracking-widest font-bold">
                  {selectedSize ? (remainingStock <= 0 ? <span className="text-[#B91C1C]">Sold Out</span> : (maxStock < 5 ? <span className="text-[#B91C1C] animate-pulse">Only {remainingStock} Left</span> : <span className="text-green-700 flex items-center gap-1"><Check size={10}/> In Stock</span>)) : <span className="text-neutral-400">Please select a size</span>}
                </div>
              </>
            )}
          </div>

          <div className="anim-content opacity-0 flex flex-col gap-3 mb-10">
            <div className="flex gap-3 h-12">
              <div className="w-32 flex items-center border border-neutral-200 bg-white">
                <button onClick={decrementQuantity} className="h-full w-10 flex items-center justify-center hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-black"><Minus size={14}/></button>
                <span className="flex-1 text-center font-bold text-sm text-black">{quantity}</span>
                <button onClick={incrementQuantity} className="h-full w-10 flex items-center justify-center hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-black"><Plus size={14}/></button>
              </div>
              <button onClick={handleAddToCart} disabled={isAdding || (selectedSize && remainingStock === 0)} className="flex-1 bg-[#B91C1C] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]">
                {isAdding ? <Loader2 className="animate-spin" size={16}/> : <><ShoppingBag size={16} /> Add to Bag</>}
              </button>
            </div>
            <button onClick={handleBuyNow} disabled={selectedSize && remainingStock === 0} className="w-full h-12 border border-black bg-transparent text-black hover:bg-black hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-50 active:scale-[0.98]">Buy It Now</button>
          </div>

          <div className="anim-content opacity-0 border-t border-neutral-100 pt-6 mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-black">Description</h3>
              <div className={`text-sm text-neutral-600 leading-7 font-medium overflow-hidden transition-all duration-500 ${descExpanded ? 'max-h-full' : 'max-h-[80px] relative'}`}>
                <p className="whitespace-pre-line">{product.description}</p>
                {!descExpanded && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent" />}
              </div>
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] mt-2 flex items-center gap-1 hover:underline">
                {descExpanded ? "Read Less" : "Read More"} {descExpanded ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
              </button>
          </div>

          <div className="anim-content opacity-0 border-t border-neutral-100 pt-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] mb-6 text-black">Reviews</h3>
            {product.reviews && product.reviews.length > 0 ? (
              <>
                <div className={`space-y-4 overflow-hidden transition-all duration-700 ${reviewsExpanded ? 'max-h-[500px] overflow-y-auto pr-2 custom-scrollbar' : 'max-h-[280px]'}`}>
                  {product.reviews.map((review, idx) => (
                    <div key={idx} className="bg-neutral-50 p-5 border border-neutral-100 rounded-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           {/* 🔐 PRIVACY: Initials + Blur = No Photo to Download */}
                           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-600 flex items-center justify-center text-[10px] font-black uppercase shadow-inner border border-white">
                              {getInitials(review.user)}
                           </div>
                           <div>
                              <span className="text-[11px] font-bold text-black block">{cleanName(review.user)}</span>
                              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <div className="flex text-[#B91C1C] gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={0}/>)}</div>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed font-medium pl-10">{review.comment}</p>
                    </div>
                  ))}
                </div>
                {product.reviews.length > 2 && (
                    <button onClick={() => setReviewsExpanded(!reviewsExpanded)} className="w-full mt-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 hover:border-[#B91C1C] hover:text-[#B91C1C] transition-colors flex items-center justify-center gap-2">
                        {reviewsExpanded ? "Show Less" : `Read All ${product.reviews.length} Reviews`} <ArrowRight size={12}/>
                    </button>
                )}
              </>
            ) : <div className="text-center py-8 bg-neutral-50 border border-dashed border-neutral-200"><p className="text-xs text-neutral-400 font-medium">No reviews yet.</p></div>}
          </div>

        </div>
      </div>

      <ImageLightbox isOpen={isLightboxOpen} onClose={() => setLightboxOpen(false)} images={product.images || []} initialIndex={activeImage} />
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} sizeGuide={product.sizeGuide} />
    </main>
  );
}