'use client';

import { useEffect, useState, useMemo } from 'react';
// ✅ IMPORT EVERYTHING FROM ONE PLACE
import { getUserOrders, submitReview, getOrderReview } from '@/app/actions'; 
import { CheckCircle, XCircle, Clock, ShoppingBag, Loader2, MapPin, Receipt, Ticket, Zap, ScanLine, Star, PenLine, Send, X, AlertCircle, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from './InvoiceTemplate';
import Barcode from 'react-barcode';

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 12, className = "" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`} style={{ transform: 'translateY(-1px)' }}>
    <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

const PLACEHOLDER_IMG = "/placeholder.jpg";

// --- VARIANTS ---
const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } } 
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

// --- NOTIFICATION ---
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-sm shadow-2xl bg-[#0a0a0a] border-l-4 border-[#B91C1C] text-white min-w-[320px]"
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
         {type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
      </div>
      <div className="flex-1">
         <h4 className="font-heading font-bold uppercase text-[10px] tracking-widest mb-0.5">{type === 'success' ? 'Success' : 'Notice'}</h4>
         <p className="text-xs text-gray-400 font-medium leading-tight">{message}</p>
      </div>
      <button onClick={onClose}><X size={14} className="text-gray-500 hover:text-white transition-colors"/></button>
    </motion.div>
  );
};

// --- REVIEW MODAL ---
const ReviewModal = ({ isOpen, onClose, product, orderId, showNotification, refreshOrders }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editInfo, setEditInfo] = useState({ isEdit: false, count: 0 });

  useEffect(() => {
    const checkReview = async () => {
       if(!isOpen) return;
       setFetching(true);
       const rawId = product.product?._id || product.product || product.productId || product._id;
       const res = await getOrderReview({ productId: rawId, orderId });
       
       if (res.found) {
          setRating(res.rating);
          setComment(res.comment);
          setEditInfo({ isEdit: true, count: res.editCount });
       }
       setFetching(false);
    };
    checkReview();
  }, [isOpen, product, orderId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return showNotification("Please write a comment.", "error");
    if (editInfo.isEdit && editInfo.count >= 3) return showNotification("Edit limit (3) reached.", "error");

    setSubmitting(true);
    const rawId = product.product?._id || product.product || product.productId || product._id;

    try {
      const result = await submitReview({ productId: rawId, rating, comment, orderId });
      if (result.success) {
        showNotification(editInfo.isEdit ? "Review updated." : "Review submitted.", "success");
        refreshOrders(); 
        onClose();
      } else {
        showNotification(result.error || "Submission failed", "error");
      }
    } catch (error) {
      showNotification("An unexpected error occurred.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200 relative flex flex-col max-h-[90vh]"
      >
        {fetching && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#B91C1C]" size={32}/>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Loading Review...</span>
            </div>
        )}

        <div className="bg-[#0a0a0a] text-white p-6 flex justify-between items-start border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white">
                    {editInfo.isEdit ? "Update Review" : "Write Review"}
                </h3>
                {editInfo.isEdit && (
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${editInfo.count >= 3 ? 'bg-red-900 text-red-200' : 'bg-neutral-800 text-neutral-400'}`}>
                        Edit {editInfo.count}/3
                    </span>
                )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4">Rate Quality</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110 focus:outline-none group">
                  <Star size={28} fill={star <= rating ? "#B91C1C" : "transparent"} className={star <= rating ? "text-[#B91C1C]" : "text-neutral-300 group-hover:text-neutral-400"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-3 block">Your Feedback</label>
            <textarea 
              className="w-full border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-black focus:border-black focus:bg-white outline-none min-h-[140px] resize-none placeholder-neutral-400 transition-all rounded-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50">
            <button 
                onClick={handleSubmit} 
                disabled={submitting || (editInfo.isEdit && editInfo.count >= 3)} 
                className="w-full bg-black text-white py-4 text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
                {submitting ? <Loader2 className="animate-spin" size={14}/> : (editInfo.isEdit ? <PenLine size={14}/> : <Send size={14}/>)}
                {editInfo.isEdit ? "Update Review" : "Submit Review"}
            </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN CLIENT ---
export default function OrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [notification, setNotification] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);

  const fetchOrders = async () => {
    if(orders.length === 0) setLoading(true);
    try {
      const data = await getUserOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const openReviewModal = (item, orderId) => {
    setReviewProduct(item);
    setReviewOrderId(orderId);
    setReviewModalOpen(true);
  };

  const triggerNotification = (message, type = 'success') => {
      setNotification({ message, type });
  };

  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
          const q = searchQuery.toLowerCase();
          const matchesSearch = !q || order.orderId?.toLowerCase().includes(q) || order.items.some(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
          const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
          const total = order.totalAmount || 0;
          const minP = priceRange.min ? parseFloat(priceRange.min) : 0;
          const maxP = priceRange.max ? parseFloat(priceRange.max) : Infinity;
          const matchesPrice = total >= minP && total <= maxP;
          const orderDate = new Date(order.createdAt);
          const startD = dateRange.start ? new Date(dateRange.start) : null;
          const endD = dateRange.end ? new Date(dateRange.end) : null;
          if (endD) endD.setHours(23, 59, 59, 999);
          const matchesDate = (!startD || orderDate >= startD) && (!endD || orderDate <= endD);
          return matchesSearch && matchesStatus && matchesPrice && matchesDate;
      });
  }, [orders, searchQuery, filterStatus, priceRange, dateRange]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-[#B91C1C] border-t-transparent rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-black">Loading History...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-32 font-sans px-4 md:px-8">
      
      <AnimatePresence>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoiceOrder && <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />}
      </AnimatePresence>

      {reviewModalOpen && (
        <ReviewModal 
          isOpen={reviewModalOpen} 
          onClose={() => setReviewModalOpen(false)} 
          product={reviewProduct}
          orderId={reviewOrderId}
          showNotification={triggerNotification}
          refreshOrders={fetchOrders} 
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b-2 border-black pb-6 flex flex-col md:flex-row justify-between items-end gap-6">
           <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B91C1C] block mb-2">My Collection</span>
              <h1 className="font-heading font-black text-4xl md:text-6xl text-black uppercase tracking-tighter leading-none">Order History</h1>
           </div>
           <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Orders</span>
              <p className="text-2xl font-black text-black leading-none">{orders.length}</p>
           </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="mb-12 bg-neutral-50 p-6 border border-neutral-200 rounded-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-[#B91C1C] transition-colors"/>
                        <input type="text" placeholder="ID, SKU, Product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 bg-white text-xs font-bold focus:border-black outline-none transition-colors placeholder:font-normal placeholder:text-gray-300"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Status</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3"/>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-8 pr-8 py-2.5 border border-neutral-200 bg-white text-xs font-bold focus:border-black outline-none appearance-none cursor-pointer">
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Date</label>
                    <div className="flex gap-2">
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full px-2 py-2.5 border border-neutral-200 bg-white text-[10px] font-bold focus:border-black outline-none uppercase"/>
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full px-2 py-2.5 border border-neutral-200 bg-white text-[10px] font-bold focus:border-black outline-none uppercase"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Price (৳)</label>
                    <div className="flex gap-2 items-center">
                        <input type="number" placeholder="MIN" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} className="w-full px-3 py-2.5 border border-neutral-200 bg-white text-xs font-bold focus:border-black outline-none placeholder:text-gray-300"/>
                        <span className="text-gray-300">-</span>
                        <input type="number" placeholder="MAX" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} className="w-full px-3 py-2.5 border border-neutral-200 bg-white text-xs font-bold focus:border-black outline-none placeholder:text-gray-300"/>
                    </div>
                </div>
            </div>
        </div>

        {/* --- ORDERS LIST --- */}
        {filteredOrders.length === 0 ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white border border-neutral-100 border-dashed rounded-lg">
             <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-200">
                <ShoppingBag size={24} className="text-neutral-300" strokeWidth={1.5}/>
             </div>
             <h2 className="font-heading font-black text-2xl text-black uppercase mb-2">No Matching Orders</h2>
             <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); setPriceRange({min:'', max:''}); setDateRange({start:'', end:''}); }} className="text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] border-b border-[#B91C1C] pb-0.5">
                Clear All Filters
             </button>
           </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
            {filteredOrders.map(order => {
              const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const shipping = order.shippingAddress?.method === 'outside' ? 150 : 80;
              const hasDiscount = order.totalAmount < (subtotal + shipping);

              return (
                <motion.div key={order._id} variants={itemVariants} className="bg-white border border-neutral-200 group hover:border-neutral-400 transition-colors shadow-sm overflow-hidden">
                  
                  {/* --- ORDER HEADER --- */}
                  <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Order ID</span>
                             <span className="text-sm font-black text-black font-heading tracking-wide">#{order.orderId ? order.orderId.slice(-6) : 'REF'}</span>
                          </div>
                          <div className="w-[1px] h-8 bg-neutral-200 hidden md:block"></div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Date</span>
                             <span className="text-xs font-bold text-black">
                                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                             </span>
                          </div>
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest border 
                        ${order.status === 'Delivered' ? 'bg-black text-white border-black' : 
                          order.status === 'Cancelled' ? 'bg-red-50 text-[#B91C1C] border-red-100' : 
                          'bg-white text-black border-neutral-300'
                        }`}>
                        {order.status === 'Delivered' ? <CheckCircle size={10}/> : order.status === 'Cancelled' ? <XCircle size={10}/> : <Clock size={10}/>}
                        {order.status}
                      </div>
                  </div>

                  {/* --- ITEMS --- */}
                  <div className="p-6 md:p-8 space-y-8">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-6 items-start">
                        <div className="w-20 h-24 bg-neutral-100 overflow-hidden flex-shrink-0 relative border border-neutral-200 shadow-sm group-hover:border-neutral-300 transition-colors">
                          <Image 
                            src={item.image || PLACEHOLDER_IMG} 
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <h4 className="font-heading font-black text-lg text-black uppercase tracking-tight leading-none mb-2">{item.name}</h4>
                                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                   {item.size && <span>Size: <span className="text-black">{item.size}</span></span>}
                                   <span>Qty: <span className="text-black">{item.quantity}</span></span>
                                </div>
                                <div className="mt-2 text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                                   <span className="flex items-center gap-1"><ScanLine size={10}/> {item.sku || 'N/A'}</span>
                                   {item.barcode && (
                                      <div className="opacity-60 mix-blend-multiply origin-left scale-75 h-5 overflow-hidden w-24">
                                          <Barcode value={item.barcode} width={1} height={20} fontSize={0} displayValue={false} margin={0} background="transparent" />
                                      </div>
                                   )}
                                </div>
                                
                                {/* ✅ DISPLAY USER'S REVIEW IF EXISTS */}
                                {item.hasReviewed && (
                                    <div className="mt-4 p-3 bg-neutral-50 border-l-2 border-[#B91C1C] max-w-md">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex text-[#B91C1C]">
                                                {[...Array(5)].map((_, idx) => (
                                                    <Star key={idx} size={10} fill={idx < (item.userRating || 5) ? "#B91C1C" : "transparent"} strokeWidth={1} />
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Your Review</span>
                                        </div>
                                        <p className="text-xs text-neutral-700 italic">"{item.userComment}"</p>
                                    </div>
                                )}
                             </div>
                             
                             <div className="text-right flex flex-col items-end gap-2 pl-4">
                                <span className="text-sm font-bold flex items-center gap-0.5"><Taka size={12}/> {item.price.toLocaleString()}</span>
                                
                                {order.status === 'Delivered' && (
                                  <button 
                                    onClick={() => openReviewModal(item, order._id)}
                                    className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors mt-2 group/btn
                                        ${item.hasReviewed ? 'text-neutral-400 hover:text-black' : 'text-[#B91C1C] hover:text-black'}
                                    `}
                                  >
                                    <PenLine size={12} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                    <span className="border-b border-black/10 group-hover/btn:border-current">
                                        {item.hasReviewed ? "Edit Review" : "Write Review"}
                                    </span>
                                  </button>
                                )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* --- FOOTER INFO --- */}
                  <div className="bg-neutral-50/30 border-t border-neutral-100 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B91C1C] mb-4 flex items-center gap-2"><MapPin size={12}/> Destination</h5>
                      <div className="text-xs font-medium text-neutral-600 leading-relaxed pl-4 border-l-2 border-neutral-200">
                        <p className="font-bold text-black uppercase">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                        <p>{order.shippingAddress?.address || order.guestInfo?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                        <p className="mt-2 font-mono text-neutral-400">{order.guestInfo?.phone}</p>
                      </div>
                    </div>
                    <div>
                        <div className="bg-white p-5 border border-neutral-200 shadow-sm">
                           {hasDiscount && (
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide text-[#B91C1C] border-b border-dashed border-neutral-200 pb-3 mb-3">
                                <span className="flex items-center gap-1">{order.couponCode ? <Ticket size={12}/> : <Zap size={12}/>}{order.couponCode ? `Coupon: ${order.couponCode}` : 'Discount Applied'}</span>
                                <span>Active</span>
                             </div>
                           )}
                           <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500"><span>Subtotal</span><span className="text-black"><Taka size={10}/> {subtotal.toLocaleString()}</span></div>
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500"><span>Shipping</span><span className="text-black"><Taka size={10}/> {shipping.toLocaleString()}</span></div>
                           </div>
                           <div className="flex justify-between items-center pt-3 border-t-2 border-black">
                              <span className="text-xs font-black text-black uppercase tracking-widest">Total Paid</span>
                              <span className="font-heading font-black text-2xl text-black flex items-center gap-1"><Taka size={18}/> {order.totalAmount?.toLocaleString()}</span>
                           </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                           <button onClick={() => setSelectedInvoiceOrder(order)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] border border-black px-5 py-3 hover:bg-black hover:text-white transition-all"><Receipt size={12} /> View Invoice</button>
                        </div>
                    </div>
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