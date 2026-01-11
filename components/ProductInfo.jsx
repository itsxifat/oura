'use client';

import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext'; 
import { ShoppingBag, Heart, Star, MessageCircle, Facebook, Check, Truck, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductInfo({ product }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  // Calculate Discount Percentage
  const discount = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  const currentPrice = product.discountPrice || product.price;

  // Contact Links
  const whatsappLink = `https://wa.me/8801700000000?text=Hi, I am interested in ${product.name}`;
  const messengerLink = `https://m.me/anaqafashion`;

  const handleAddToCart = () => {
    setLoading(true);
    setTimeout(() => {
      addToCart(product, 1); 
      setLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 600);
  };

  return (
    <div className="font-manrope space-y-8 sticky top-32">
      
      {/* Header & Price */}
      <div className="border-b border-gray-100 pb-8">
        <div className="flex items-center gap-2 mb-4">
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">New Arrival</span>
            {product.stock > 0 ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1">In Stock</span>
            ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1">Out of Stock</span>
            )}
        </div>

        <h1 className="font-bodoni text-4xl md:text-5xl text-gray-900 mb-4 leading-tight">{product.name}</h1>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex text-gold-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < (product.rating || 5) ? "currentColor" : "none"} className={i < (product.rating || 5) ? "text-gold-500" : "text-gray-300"} />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{product.reviews?.length || 0} Reviews</span>
        </div>

        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-bold text-black">৳{currentPrice.toLocaleString()}</span>
          {product.discountPrice && (
            <>
              <span className="text-lg text-gray-400 line-through">৳{product.price.toLocaleString()}</span>
              <span className="text-red-600 text-xs font-bold uppercase tracking-wider">
                Save {discount}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed font-normal">
            {product.description}
        </p>
        
        <ul className="grid grid-cols-2 gap-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><Truck size={14}/> Fast Delivery</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14}/> Authentic Product</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button 
          onClick={handleAddToCart}
          disabled={loading || product.stock === 0}
          className={`
            flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3
            ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-900'}
            ${product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-300' : ''}
          `}
        >
          {product.stock === 0 ? 'Sold Out' : added ? <><Check size={18}/> Added</> : <><ShoppingBag size={18}/> Add to Cart</>}
        </button>
        
        <button 
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`p-4 border ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'} transition-all`}
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Contact Admin */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Have questions? Chat with us</p>
        <div className="flex gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-lg text-xs font-bold uppercase hover:bg-[#20bd5a] transition shadow-sm hover:shadow-md">
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={messengerLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0084FF] text-white rounded-lg text-xs font-bold uppercase hover:bg-[#0078e7] transition shadow-sm hover:shadow-md">
            <Facebook size={16} /> Messenger
          </a>
        </div>
      </div>

    </div>
  );
}