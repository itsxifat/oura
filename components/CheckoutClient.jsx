'use client';

import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, saveAddress } from '@/app/actions';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, MapPin, Truck, CreditCard, CheckCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode'; 

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 14, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block align-middle ${className}`}
    style={{ transform: 'translateY(-1px)' }}
  >
    <text 
      x="50%" 
      y="58%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontSize="22" 
      fontWeight="bold" 
      fill="currentColor" 
      style={{ fontFamily: "var(--font-heading)" }} 
    >
      ৳
    </text>
  </svg>
);

// --- ERROR MODAL ---
const ErrorModal = ({ error, onClose }) => {
  if (!error) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white p-6 max-w-sm w-full text-center shadow-2xl relative border border-neutral-200 rounded-sm"
      >
        <div className="w-10 h-10 bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100 rounded-full">
            <AlertTriangle size={20} className="text-[#B91C1C]" />
        </div>
        <h3 className="font-heading font-black text-xl text-black uppercase mb-2">Order Issue</h3>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed font-medium">{error}</p>
        <button onClick={onClose} className="w-full bg-black text-white py-3 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#B91C1C] transition-colors">
            Return to Cart
        </button>
      </motion.div>
    </div>
  );
};

// --- COMPACT INPUT ---
const MinimalInput = ({ name, placeholder, value, onChange, type = "text", required = true, className="" }) => (
  <div className={`relative group pt-2 ${className}`}>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      required={required}
      className="peer block w-full border-b border-neutral-200 bg-transparent py-1.5 text-xs font-bold text-black focus:border-[#B91C1C] focus:outline-none transition-colors placeholder-transparent rounded-none"
    />
    <label className="absolute left-0 top-0 text-[9px] font-bold uppercase tracking-widest text-neutral-400 transition-all 
      peer-placeholder-shown:top-2 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-medium peer-placeholder-shown:text-neutral-400 
      peer-focus:top-0 peer-focus:text-[8px] peer-focus:font-black peer-focus:text-[#B91C1C]">
      {placeholder} {required && '*'}
    </label>
  </div>
);

export default function CheckoutClient({ savedAddresses = [] }) {
  const { cart, appliedCoupon, clearCart } = useCart(); 
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); 
  const [useSavedAddress, setUseSavedAddress] = useState(savedAddresses.length > 0);
  const [selectedAddressId, setSelectedAddressId] = useState(savedAddresses[0]?._id || null);
  const [shippingMethod, setShippingMethod] = useState('inside');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '', label: 'Home'
  });

  const cartSubTotal = cart.reduce((total, item) => {
    const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
    return total + (effectivePrice * item.quantity);
  }, 0);

  const shippingCost = shippingMethod === 'inside' ? 80 : 150;
  const discountAmount = appliedCoupon ? appliedCoupon.amount : 0;
  const finalTotal = Math.max(0, cartSubTotal + shippingCost - discountAmount);

  useEffect(() => {
    if (cart.length === 0) router.push('/cart');
  }, [cart, router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let finalData = {};
    if (useSavedAddress && selectedAddressId) {
      const addr = savedAddresses.find(a => a._id === selectedAddressId);
      finalData = { ...addr };
    } else {
      finalData = { ...formData };
      if (isSavingAddress) {
        const saveFormData = new FormData();
        Object.keys(formData).forEach(key => saveFormData.append(key, formData[key]));
        await saveAddress(saveFormData);
      }
    }

    const orderData = {
      guestInfo: {
        firstName: finalData.firstName, lastName: finalData.lastName,
        email: finalData.email, phone: finalData.phone,
        address: finalData.address, city: finalData.city, postalCode: finalData.postalCode
      },
      items: cart.map(item => {
        const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
        return {
            product: item._id,
            name: item.name,
            price: effectivePrice,
            quantity: item.quantity,
            size: item.selectedSize || item.size || "STD", 
            image: item.images?.[0] || item.image || '/placeholder.jpg'
        };
      }),
      shippingAddress: {
        address: finalData.address, city: finalData.city,
        postalCode: finalData.postalCode, method: shippingMethod
      },
      couponCode: appliedCoupon?.code || null,
      totalAmount: finalTotal,
      paymentMethod: 'COD'
    };

    const res = await createOrder(orderData);

    if (res.success) {
      clearCart();
      router.refresh(); 
      router.push('/account/orders'); 
    } else {
      setErrorMsg(res.error || "Order failed. Please try again.");
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 font-sans bg-white min-h-screen">
      
      <AnimatePresence>
        {errorMsg && <ErrorModal error={errorMsg} onClose={() => { setErrorMsg(null); router.push('/cart'); }} />}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-3">
        <div className="flex items-center gap-4">
            <Link href="/cart" className="w-8 h-8 flex items-center justify-center border border-neutral-200 hover:bg-black hover:text-white transition-all group">
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/>
            </Link>
            <div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#B91C1C] block">Final Step</span>
                <h1 className="font-heading font-black text-2xl md:text-3xl text-black uppercase tracking-tighter leading-none">Checkout</h1>
            </div>
        </div>
        <div className="hidden md:block text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total Payable</p>
            <p className="font-heading font-bold text-lg flex items-center justify-end gap-1"><Taka size={16}/>{finalTotal.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT COLUMN: DETAILS (Compact Form) --- */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. SHIPPING INFO */}
          <div>
             <h2 className="font-heading font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
               <span className="w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-sm">1</span>
               Shipping Details
             </h2>

             {savedAddresses.length > 0 && (
               <div className="mb-4 flex gap-4 border-b border-neutral-100 pb-2">
                 <button type="button" onClick={() => setUseSavedAddress(true)} 
                    className={`pb-1 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${useSavedAddress ? 'border-[#B91C1C] text-[#B91C1C]' : 'border-transparent text-neutral-400 hover:text-black'}`}>
                   Saved Addresses
                 </button>
                 <button type="button" onClick={() => setUseSavedAddress(false)} 
                    className={`pb-1 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${!useSavedAddress ? 'border-[#B91C1C] text-[#B91C1C]' : 'border-transparent text-neutral-400 hover:text-black'}`}>
                   New Address
                 </button>
               </div>
             )}

             <AnimatePresence mode='wait'>
               {useSavedAddress && savedAddresses.length > 0 ? (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div key={addr._id} onClick={() => setSelectedAddressId(addr._id)} 
                        className={`cursor-pointer p-4 border transition-all relative ${selectedAddressId === addr._id ? 'border-[#B91C1C] bg-[#B91C1C]/5' : 'border-neutral-200 hover:border-black'}`}>
                        
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white border border-neutral-200 px-1.5 py-0.5">{addr.label}</span>
                            {selectedAddressId === addr._id && <CheckCircle size={14} className="text-[#B91C1C]" />}
                        </div>
                        <p className="font-bold text-xs text-black mb-0.5">{addr.firstName} {addr.lastName}</p>
                        <p className="text-[10px] text-neutral-500 leading-relaxed mb-1 truncate">{addr.address}</p>
                        <p className="text-[10px] font-mono text-neutral-400">{addr.phone}</p>
                      </div>
                    ))}
                 </motion.div>
               ) : (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                       <MinimalInput name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} />
                       <MinimalInput name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <MinimalInput name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} />
                       <MinimalInput name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required={false} />
                    </div>
                    <MinimalInput name="address" placeholder="Street Address" value={formData.address} onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-4">
                       <MinimalInput name="city" placeholder="City" value={formData.city} onChange={handleInputChange} />
                       <MinimalInput name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleInputChange} />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                       <input type="checkbox" id="saveAddr" checked={isSavingAddress} onChange={(e) => setIsSavingAddress(e.target.checked)} className="w-3.5 h-3.5 accent-black cursor-pointer" />
                       <label htmlFor="saveAddr" className="text-[10px] font-bold text-neutral-500 cursor-pointer select-none tracking-wide uppercase">Save address for later</label>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* 2. DELIVERY METHOD */}
          <div className="pt-6 border-t border-dashed border-neutral-200">
             <h2 className="font-heading font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
               <span className="w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-sm">2</span>
               Delivery Method
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {['inside', 'outside'].map((method) => (
                 <div key={method} onClick={() => setShippingMethod(method)} 
                    className={`cursor-pointer p-3 border transition-all flex items-center justify-between ${shippingMethod === method ? 'border-black bg-black text-white shadow-xl' : 'border-neutral-200 hover:border-neutral-400'}`}>
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5">
                       {method === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                     </span>
                     <span className={`text-[9px] font-medium uppercase ${shippingMethod === method ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        2-3 Days
                     </span>
                   </div>
                   <span className="text-xs font-bold flex items-center">
                     <Taka size={12}/>{method === 'inside' ? '80' : '150'}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: COMPACT SUMMARY --- */}
        <div className="lg:col-span-5">
           <div className="bg-neutral-50 p-6 border border-neutral-200 lg:sticky lg:top-8 rounded-sm">
             
             <h2 className="font-heading font-black text-lg mb-4 flex items-center gap-2 uppercase tracking-tight">
               Order Review ({cart.length})
             </h2>
             
             {/* LIST CONTAINER WITH PADDING-TOP TO FIX BADGE CUTOFF */}
             <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pt-4 pr-2 custom-scrollbar border-b border-dashed border-neutral-200 pb-4">
                {cart.map((item) => {
                   const itemPrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
                   return (
                     <div key={`${item._id}-${item.selectedSize}`} className="flex gap-3 items-start relative group">
                        
                        {/* Wrapper for Image + Badge */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-16 bg-white border border-neutral-200 overflow-hidden relative">
                                <Image 
                                    src={item.images?.[0] || item.image || '/placeholder.jpg'} 
                                    alt={item.name} 
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                />
                            </div>
                            {/* Count Badge positioned relative to image wrapper */}
                            <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md z-10">
                                {item.quantity}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pt-0.5">
                           <div className="flex justify-between items-start">
                                <h4 className="font-bold text-[11px] text-black truncate uppercase tracking-tight max-w-[70%]">{item.name}</h4>
                                <p className="text-[11px] font-bold text-black flex items-center">
                                    <Taka size={10}/>{(itemPrice * item.quantity).toLocaleString()}
                                </p>
                           </div>
                           <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">
                              {item.selectedSize || "STD"} {item.sku && <span className="font-mono text-neutral-300">| {item.sku}</span>}
                           </p>
                           
                           {/* Barcode (Smaller) */}
                           {item.barcode && (
                              <div className="mt-1 opacity-40 mix-blend-multiply origin-left scale-[0.6]">
                                  <Barcode value={item.barcode} width={1} height={15} fontSize={0} displayValue={false} margin={0} background="transparent" />
                              </div>
                           )}
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Totals */}
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                   <span>Subtotal</span>
                   <span className="text-black flex items-center"><Taka size={9}/>{cartSubTotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-[#B91C1C]">
                      <span>Discount</span>
                      <span className="flex items-center">-<Taka size={9}/>{appliedCoupon.amount.toLocaleString()}</span>
                   </div>
                )}
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                   <span>Shipping</span>
                   <span className="text-black flex items-center"><Taka size={9}/>{shippingCost.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-end pt-3 mt-1 border-t border-neutral-200">
                   <span className="font-heading font-black text-lg text-black uppercase">Total</span>
                   <span className="font-heading font-black text-2xl text-[#B91C1C] leading-none flex items-center gap-1">
                      <Taka size={18}/>{finalTotal.toLocaleString()}
                   </span>
                </div>
             </div>

             {/* Payment Mode */}
             <div className="mt-6 bg-white border border-neutral-200 p-3 flex items-center gap-3">
                <CreditCard size={16} className="text-[#B91C1C]"/>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-black">Cash On Delivery</p>
                   <p className="text-[9px] text-neutral-400">Pay securely upon delivery.</p>
                </div>
             </div>

             {/* Submit */}
             <button type="submit" disabled={loading} className="w-full mt-6 bg-black text-white py-3.5 text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group">
                {loading ? <Loader2 className="animate-spin" size={14}/> : <>Confirm Order <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></>}
             </button>

           </div>
        </div>

      </form>
    </div>
  );
}