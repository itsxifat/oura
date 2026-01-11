'use client';

import { useEffect, useState } from 'react';
import { getUserOrders } from '@/app/actions';
import { submitReview } from '@/actions/reviews'; // Ensure this path matches your file structure
import { CheckCircle, XCircle, Clock, ShoppingBag, Loader2, MapPin, Receipt, Ticket, Zap, ScanLine, Barcode, Star, PenLine, Send } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from './InvoiceTemplate';

// --- FIXED TAKA ICON (Sharp Vector) ---
const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const PLACEHOLDER_IMG = "https://placehold.co/400x500/f5f5f5/000000/png?text=ANAQA";

// --- REVIEW MODAL ---
const ReviewModal = ({ isOpen, onClose, product, orderId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return alert("Please write a short comment.");
    setSubmitting(true);

    // --- FIX: ROBUST ID EXTRACTION ---
    // Handles cases where productId is a String OR a Populated Object
    const rawId = product.productId || product._id;
    const actualProductId = typeof rawId === 'object' ? rawId._id : rawId;

    try {
      const result = await submitReview({
        productId: actualProductId,
        rating,
        comment,
        orderId
      });

      if (result.success) {
        alert("Review submitted successfully!");
        onClose();
      } else {
        alert(result.error || "Submission failed");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="bg-black text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="font-bodoni text-xl italic">Write a Review</h3>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mt-1 line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><XCircle size={20}/></button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Rate Quality</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                  <Star size={28} fill={star <= rating ? "#D4AF37" : "none"} className={star <= rating ? "text-[#D4AF37]" : "text-gray-300"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Your Feedback</label>
            <textarea 
              className="w-full border border-gray-200 rounded-lg p-4 text-sm focus:border-black outline-none min-h-[100px] resize-none"
              placeholder="How was the fit? The fabric?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-black text-white py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
            Submit Review
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function OrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  
  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const openReviewModal = (item, orderId) => {
    setReviewProduct(item);
    setReviewOrderId(orderId);
    setReviewModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-manrope text-[#D4AF37]">
      <Loader2 className="animate-spin mb-4" size={32} />
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Loading History...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 pb-24 font-manrope px-4 md:px-8">
      
      <AnimatePresence>
        {selectedInvoiceOrder && <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />}
      </AnimatePresence>

      {reviewModalOpen && (
        <ReviewModal 
          isOpen={reviewModalOpen} 
          onClose={() => setReviewModalOpen(false)} 
          product={reviewProduct}
          orderId={reviewOrderId}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center md:text-left">
           <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] block mb-2">My Collection</span>
           <h1 className="font-bodoni text-4xl md:text-5xl text-black">Order History</h1>
        </div>

        {orders.length === 0 ? (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={32} className="text-gray-300" strokeWidth={1}/>
             </div>
             <h2 className="font-bodoni text-2xl text-black mb-2">No Past Orders</h2>
             <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">Your collection awaits.</p>
             <Link href="/product" className="inline-block bg-black text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-colors">Start Shopping</Link>
           </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {orders.map(order => {
              const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const shipping = order.shippingAddress?.method === 'outside' ? 150 : 80;
              const hasDiscount = order.totalAmount < (subtotal + shipping);

              return (
                <motion.div key={order._id} variants={itemVariants} className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden group transition-all duration-300 hover:shadow-lg">
                  
                  {/* --- 1. HEADER (ID & Status) --- */}
                  <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bodoni font-bold text-xs">
                            #{order.orderId ? order.orderId.slice(-4) : 'REF'}
                         </div>
                         <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">ID: #{order.orderId || order._id.slice(-6)}</span>
                            <span className="text-xs font-bold text-black">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                         </div>
                      </div>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-[#fffdf5] text-[#bfa03a] border-[#D4AF37]/20'
                      }`}>
                        {order.status === 'Delivered' ? <CheckCircle size={12}/> : order.status === 'Cancelled' ? <XCircle size={12}/> : <Clock size={12}/>}
                        {order.status}
                      </span>
                  </div>

                  {/* --- 2. ITEMS LIST --- */}
                  <div className="p-6 md:p-8 space-y-6">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-6 items-start">
                        <div className="w-16 h-20 bg-gray-50 rounded-sm overflow-hidden flex-shrink-0 border border-gray-100">
                          <img 
                            src={item.image || PLACEHOLDER_IMG} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMG; }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bodoni text-lg text-black">{item.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                             {item.size && (
                               <span className="text-[9px] font-bold uppercase tracking-widest text-black border border-gray-200 px-2 py-1 rounded-sm">
                                 Size: {item.size}
                               </span>
                             )}
                             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 px-2 py-1 rounded-sm">
                               Qty: {item.quantity}
                             </span>
                             <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-100 px-2 py-1 rounded-sm">
                               <ScanLine size={10}/> {item.sku || 'N/A'}
                             </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-sm font-bold flex items-center gap-1"><Taka size={12}/> {item.price.toLocaleString()}</span>
                          
                          {/* REVIEW BUTTON (Only if Delivered) */}
                          {order.status === 'Delivered' && (
                            <button 
                              onClick={() => openReviewModal(item, order._id)}
                              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] border-b border-[#D4AF37] pb-0.5 hover:text-black hover:border-black transition-all mt-1"
                            >
                              <PenLine size={10} /> Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* --- 3. FULL ADDRESS & BILLING BREAKDOWN (Your Original UI) --- */}
                  <div className="px-6 md:px-8 py-6 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address Section */}
                    <div>
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                        <MapPin size={12}/> Shipping Address
                      </h5>
                      <div className="text-xs text-gray-600 leading-relaxed pl-4 border-l-2 border-gray-200">
                        <p className="font-bold text-black">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                        <p>{order.shippingAddress?.address || order.guestInfo?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                        <p className="mt-1 text-gray-400 font-mono">{order.guestInfo?.phone}</p>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        {/* Discount Row */}
                        {hasDiscount && (
                          <div className="flex justify-between items-center text-xs mb-3 text-green-600 border-b border-gray-50 pb-2">
                             <span className="flex items-center gap-1">
                               {order.couponCode ? <Ticket size={12}/> : <Zap size={12}/>}
                               Discount {order.couponCode && <span className="font-mono text-[10px] bg-green-100 px-1 rounded ml-1">{order.couponCode}</span>}
                             </span>
                             <span className="font-bold">Applied</span>
                          </div>
                        )}
                        
                        <div className="space-y-1 mb-3">
                           <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                              <span>Subtotal</span>
                              <span><Taka size={10}/> {subtotal.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                              <span>Shipping</span>
                              <span><Taka size={10}/> {shipping.toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                           <span className="text-xs font-bold text-black uppercase tracking-widest">Total Paid</span>
                           <span className="font-bodoni text-xl font-bold text-black flex items-center gap-1">
                             <Taka size={16}/> {order.totalAmount?.toLocaleString()}
                           </span>
                        </div>
                    </div>
                  </div>

                  {/* --- 4. FOOTER: ACTIONS --- */}
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Method: <span className="text-black font-bold">Cash On Delivery</span>
                      </div>
                      <button onClick={() => setSelectedInvoiceOrder(order)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition-all">
                         <Receipt size={14} /> Download Invoice
                      </button>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}