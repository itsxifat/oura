'use client';

import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, saveAddress } from '@/app/actions';
import Link from 'next/link';
import { ArrowLeft, MapPin, Truck, CreditCard, CheckCircle, Loader2, Sparkles, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Install this: npm install react-barcode
import Barcode from 'react-barcode'; 

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

// --- ERROR MODAL COMPONENT ---
const ErrorModal = ({ error, onClose }) => {
  if (!error) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="font-bodoni text-2xl text-black mb-2">Order Issue</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
        <button onClick={onClose} className="w-full bg-black text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors">
            Update Cart
        </button>
      </motion.div>
    </div>
  );
};

// --- MINIMAL INPUT ---
const MinimalInput = ({ name, placeholder, value, onChange, type = "text", required = true }) => (
  <div className="relative group pt-4">
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      required={required}
      className="peer block w-full border-b border-gray-200 bg-transparent py-2.5 text-sm text-black focus:border-black focus:outline-none focus:ring-0 transition-colors placeholder-transparent"
    />
    <label className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-all 
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 
      peer-focus:top-0 peer-focus:text-[9px] peer-focus:font-bold peer-focus:text-[#D4AF37]">
      {placeholder}
    </label>
  </div>
);

export default function CheckoutClient({ savedAddresses = [] }) {
  const { cart, appliedCoupon, clearCart } = useCart(); // Removed grandTotal from context to calc locally
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

  // --- PRICE CALCULATION FIX ---
  // Calculate subtotal using the effective price (discounted if applicable)
  const cartSubTotal = cart.reduce((total, item) => {
    const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
    return total + (effectivePrice * item.quantity);
  }, 0);

  const shippingCost = shippingMethod === 'inside' ? 80 : 150;
  const discountAmount = appliedCoupon ? appliedCoupon.amount : 0;
  
  // Ensure total doesn't go below zero
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
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        email: finalData.email,
        phone: finalData.phone,
        address: finalData.address,
        city: finalData.city,
        postalCode: finalData.postalCode
      },
      items: cart.map(item => {
        // Calculate price for individual item payload to be consistent
        const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
        return {
            product: item._id,
            name: item.name,
            price: effectivePrice, // Send CORRECT price to backend
            quantity: item.quantity,
            size: item.selectedSize || item.size || "STD", 
            image: item.images?.[0] || item.image || '/placeholder.jpg'
        };
      }),
      shippingAddress: {
        address: finalData.address,
        city: finalData.city,
        postalCode: finalData.postalCode,
        method: shippingMethod
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
      setErrorMsg(res.error || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 pb-32 font-manrope">
      
      {/* Stock Error Modal */}
      <AnimatePresence>
        {errorMsg && <ErrorModal error={errorMsg} onClose={() => { setErrorMsg(null); router.push('/cart'); }} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
        <Link href="/cart" className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-black hover:text-white transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
           <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] block mb-1">Secure Checkout</span>
           <h1 className="font-bodoni text-3xl md:text-4xl text-black">Finalize Order</h1>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* 1. SHIPPING DETAILS */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="font-bodoni text-xl mb-8 flex items-center gap-3">
               <MapPin size={18} className="text-[#D4AF37]" /> Shipping Details
             </h2>

             {savedAddresses.length > 0 && (
               <div className="mb-8 flex p-1 bg-gray-50 rounded-lg max-w-xs">
                 <button type="button" onClick={() => setUseSavedAddress(true)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${useSavedAddress ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                   Saved
                 </button>
                 <button type="button" onClick={() => setUseSavedAddress(false)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${!useSavedAddress ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                   New
                 </button>
               </div>
             )}

             <AnimatePresence mode='wait'>
               {useSavedAddress && savedAddresses.length > 0 ? (
                 <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="grid grid-cols-1 gap-4">
                    {savedAddresses.map((addr) => (
                      <div key={addr._id} onClick={() => setSelectedAddressId(addr._id)} className={`cursor-pointer p-5 rounded-xl border transition-all flex items-start gap-4 ${selectedAddressId === addr._id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 flex-shrink-0 ${selectedAddressId === addr._id ? 'border-[#D4AF37]' : 'border-gray-300'}`}>
                           {selectedAddressId === addr._id && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-sm text-black">{addr.firstName} {addr.lastName}</span>
                             <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-sm">{addr.label}</span>
                           </div>
                           <p className="text-xs text-gray-500 leading-relaxed">{addr.address}, {addr.city}</p>
                           <p className="text-xs text-gray-500 mt-1 font-medium">{addr.phone}</p>
                        </div>
                      </div>
                    ))}
                 </motion.div>
               ) : (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <MinimalInput name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} />
                       <MinimalInput name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <MinimalInput name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} />
                       <MinimalInput name="email" type="email" placeholder="Email (Optional)" value={formData.email} onChange={handleInputChange} required={false} />
                    </div>
                    <MinimalInput name="address" placeholder="Full Address (House, Road, Area)" value={formData.address} onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-6">
                       <MinimalInput name="city" placeholder="City" value={formData.city} onChange={handleInputChange} />
                       <MinimalInput name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleInputChange} />
                    </div>
                    
                    <div className="flex items-center gap-3 pt-4">
                       <input type="checkbox" id="saveAddr" checked={isSavingAddress} onChange={(e) => setIsSavingAddress(e.target.checked)} className="w-4 h-4 accent-black cursor-pointer" />
                       <label htmlFor="saveAddr" className="text-xs font-bold text-gray-500 cursor-pointer select-none tracking-wide">Save for future orders</label>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* 2. DELIVERY METHOD */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="font-bodoni text-xl mb-6 flex items-center gap-3">
               <Truck size={18} className="text-[#D4AF37]" /> Delivery Method
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {['inside', 'outside'].map((method) => (
                 <div key={method} onClick={() => setShippingMethod(method)} className={`cursor-pointer p-5 rounded-xl border transition-all flex items-center justify-between ${shippingMethod === method ? 'border-black bg-black text-white shadow-lg transform scale-[1.02]' : 'border-gray-200 hover:border-gray-300'}`}>
                   <div>
                     <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">
                       {method === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                     </span>
                     <span className={`text-[10px] ${shippingMethod === method ? 'text-gray-400' : 'text-gray-500'}`}>2-3 Business Days</span>
                   </div>
                   <span className="text-sm font-bold flex items-center">
                     <Taka size={12}/>{method === 'inside' ? '80' : '150'}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
        <div className="lg:col-span-5">
           <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 lg:sticky lg:top-24 relative overflow-hidden">
             
             <div className="absolute top-0 left-0 w-full h-[3px] bg-[#D4AF37]"></div>

             <h2 className="font-bodoni text-xl mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
               <Sparkles size={16} className="text-[#D4AF37]" /> Order Summary
             </h2>
             
             <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {cart.map((item) => {
                   // Calculate item-specific price for display
                   const itemPrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
                   
                   return (
                     <div key={`${item._id}-${item.selectedSize || item.size || 'std'}`} className="flex gap-4 items-start">
                        <div className="w-14 h-16 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100 relative">
                           <img src={item.images?.[0] || item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover"/>
                           <span className="absolute bottom-0 right-0 bg-black text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center">{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bodoni text-sm text-black truncate">{item.name}</h4>
                           <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 space-y-1">
                              <p className="truncate">
                                  {item.category?.name} 
                                  <span className="text-black font-bold ml-1">
                                      • {item.selectedSize || item.size || "STD"}
                                  </span>
                              </p>
                              {/* SKU Display */}
                              {item.sku && <p className="font-mono text-[9px]">SKU: {item.sku}</p>}
                           </div>
                           
                           {/* SCANNABLE BARCODE (Hidden if no barcode) */}
                           {item.barcode && (
                              <div className="mt-2 mix-blend-multiply opacity-70 origin-left scale-75">
                                  <Barcode 
                                      value={item.barcode} 
                                      width={1} 
                                      height={25} 
                                      fontSize={10} 
                                      displayValue={false} 
                                      background="transparent" 
                                      margin={0}
                                  />
                              </div>
                           )}
                        </div>
                        <span className="text-sm font-medium flex items-center text-black">
                          <Taka size={12}/>{(itemPrice * item.quantity).toLocaleString()}
                        </span>
                     </div>
                   );
                })}
             </div>

             <div className="bg-[#faf9f6] p-4 rounded-xl space-y-3 mb-6">
                <div className="flex justify-between text-xs text-gray-600">
                   <span>Subtotal</span>
                   <span className="font-bold flex items-center"><Taka size={10}/>{cartSubTotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                   <div className="flex justify-between text-xs text-[#D4AF37]">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-bold flex items-center">-<Taka size={10}/>{appliedCoupon.amount.toLocaleString()}</span>
                   </div>
                )}
                <div className="flex justify-between text-xs text-gray-600">
                   <span>Shipping ({shippingMethod === 'inside' ? 'Inside' : 'Outside'})</span>
                   <span className="font-bold flex items-center"><Taka size={10}/>{shippingCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                   <span className="font-bodoni text-lg text-black">Total</span>
                   <span className="font-bodoni text-xl text-black flex items-center gap-1 font-bold">
                     <Taka size={18}/>{finalTotal.toLocaleString()}
                   </span>
                </div>
             </div>

             <div className="flex items-start gap-3 mb-6 p-3 border border-gray-100 rounded-lg bg-white">
                <CreditCard size={16} className="text-[#D4AF37] mt-0.5"/>
                <div>
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Cash On Delivery</h4>
                   <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Pay securely in cash when your order arrives.</p>
                </div>
             </div>

             <button type="submit" disabled={loading} className="group relative w-full h-14 bg-black overflow-hidden flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent translate-x-[-100%] group-hover:animate-[shine_1s_ease-in-out_infinite]" />
                <span className="relative z-10 text-white text-[11px] font-bold uppercase tracking-[0.25em] group-hover:text-[#D4AF37] transition-colors flex items-center gap-2">
                   {loading ? <Loader2 className="animate-spin" size={16}/> : <><CheckCircle size={16} /> Place Order</>}
                </span>
             </button>

             <p className="text-[9px] text-center text-gray-400 mt-4 leading-relaxed px-4">
               By placing this order, you agree to ANAQA's Terms of Service.
             </p>

           </div>
        </div>

      </form>
    </div>
  );
}