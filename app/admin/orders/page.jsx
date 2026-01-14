'use client';

import React, { useEffect, useState, useMemo } from 'react'; 
import { getAdminOrders, updateOrderStatus } from '@/app/actions';
import { checkFraud } from '@/actions/fraud'; 
import { sendToSteadfast, bulkShipToSteadfast } from '@/actions/steadfast'; 
import { 
  Package, Truck, Check, X, Search, 
  ChevronDown, ChevronUp, MapPin, 
  User, CreditCard, ShoppingBag, 
  ShieldAlert, TicketPercent, Send, Filter, MoreHorizontal, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast'; 
import Barcode from 'react-barcode'; 

// --- TAKA SVG COMPONENT ---
const Taka = ({ size = 14, className = "", weight = "bold" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

// --- HELPER: FORMAT ID ---
const formatOrderId = (id) => {
  if (!id) return '';
  return id.startsWith('#') ? id : `#${id}`;
};

// --- COMPONENT: FRAUD CHECK MODAL ---
const FraudCheckModal = ({ isOpen, onClose, customer }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      checkFraud(customer.phone)
        .then(result => { setData(result); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setData(null);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const getSteadfastStats = () => {
      if (!data?.sources?.steadfast) return { total: 0, delivered: 0, returned: 0 };
      const s = data.sources.steadfast;
      return {
          total: (s.total_delivered || 0) + (s.total_cancelled || 0),
          delivered: s.total_delivered || 0,
          returned: s.total_cancelled || 0
      };
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-manrope border border-gray-100"
      >
        <div className="bg-[#800000] text-white p-6 flex justify-between items-center relative overflow-hidden">
           {/* Decorative Corner */}
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
           
           <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 block mb-1">Risk Analysis</span>
              <h3 className="font-bodoni text-2xl">{customer?.firstName}</h3>
           </div>
           <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors relative z-10"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#faf9f6]">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="animate-spin text-[#800000] mb-4" size={32}/>
                 <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Scanning Databases...</p>
              </div>
           ) : data ? (
              <>
                 {data.sources.steadfast.frauds && data.sources.steadfast.frauds.length > 0 && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                       <div className="flex gap-3 items-center mb-2">
                          <ShieldAlert size={20} className="text-[#800000]"/>
                          <h4 className="font-bold text-[#800000] text-sm uppercase tracking-wide">Fraud Record Found</h4>
                       </div>
                       <div className="space-y-2">
                          {data.sources.steadfast.frauds.map((f, i) => (
                             <div key={i} className="text-xs bg-white p-3 rounded-lg border border-red-100 text-gray-700 shadow-sm leading-relaxed">
                                {f.details || "No details available."}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className={`text-4xl font-bodoni font-bold ${data.score < 50 ? 'text-[#800000]' : 'text-green-700'}`}>{data.score}%</div>
                    <div className="flex-1 border-l border-gray-100 pl-5">
                       <h4 className="font-bold text-sm uppercase text-gray-900 tracking-wide">{data.level} Risk</h4>
                       <p className="text-xs text-gray-500 mt-1 leading-snug">{data.suggestion}</p>
                    </div>
                 </div>

                 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                    <StatRow label="Internal" data={data.sources.internal} />
                    <StatRow label="Steadfast" data={getSteadfastStats()} />
                    <StatRow label="Pathao" data={data.sources.pathao} />
                 </div>
              </>
           ) : (
              <div className="text-center py-10 text-gray-400">
                 <p className="text-xs uppercase tracking-widest">No analysis data available.</p>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const StatRow = ({ label, data }) => {
  if (!data) return null;
  return (
    <div className="flex justify-between items-center text-xs p-4 hover:bg-gray-50 transition-colors">
       <div className="font-bold text-gray-900 w-1/3 uppercase tracking-wide flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
          {label}
       </div>
       <div className="flex gap-6 w-2/3 justify-end">
          <div className="text-center">
             <span className="block font-bold text-lg text-gray-900">{data.total || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Total</span>
          </div>
          <div className="text-center">
             <span className="block font-bold text-lg text-green-700">{data.delivered || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Done</span>
          </div>
          <div className="text-center">
             <span className="block font-bold text-lg text-[#800000]">{data.returned || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Return</span>
          </div>
       </div>
    </div>
  );
};

// --- COMPONENT: CANCEL MODAL ---
const CancelModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const reasons = ["Customer Request", "Stock Issue", "Duplicate Order", "Fraud Suspected", "Other"];
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
        
        <h3 className="font-bodoni text-2xl text-black mb-2">Cancel Order</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">Please select a reason for cancellation.</p>
        
        <div className="space-y-2">
           {reasons.map((reason) => (
              <button 
                key={reason} 
                onClick={() => onConfirm(reason)} 
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-[#800000] rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-transparent hover:border-red-100 group flex justify-between items-center"
              >
                {reason}
                <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 -rotate-90 transition-all"/>
              </button>
           ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-black transition-colors">Dismiss</button>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Action States
  const [shippingId, setShippingId] = useState(null);
  const [bulkShipping, setBulkShipping] = useState(false);

  // Modals
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [fraudCheckCustomer, setFraudCheckCustomer] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const data = await getAdminOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleShipToSteadfast = async (id) => {
      setShippingId(id);
      try {
          const res = await sendToSteadfast(id);
          if(res.success) {
              toast.success(`Shipped! Tracking: ${res.tracking_code}`);
              loadOrders();
          } else {
              toast.error(res.error || "Failed to send");
          }
      } catch (e) {
          toast.error("Network Error");
      }
      setShippingId(null);
  };

  const handleBulkShip = async () => {
      if(!confirm("Send ALL 'Processing' orders to Steadfast?")) return;
      setBulkShipping(true);
      try {
          const res = await bulkShipToSteadfast();
          if(res.success) {
              toast.success(`Shipped ${res.count || 'multiple'} orders.`);
              loadOrders();
          } else {
              toast.error(res.error || "Bulk ship failed");
          }
      } catch(e) {
          toast.error("Network Error");
      }
      setBulkShipping(false);
  };

  const handleStatusChange = async (id, status, reason = null) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    await updateOrderStatus(id, status, reason);
    const data = await getAdminOrders();
    setOrders(data);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
      const searchLower = searchTerm.toLowerCase();
      const orderIdStr = order.orderId ? order.orderId.toString().toLowerCase() : '';
      return orderIdStr.includes(searchLower) || 
             (order.guestInfo?.firstName + ' ' + order.guestInfo?.lastName).toLowerCase().includes(searchLower) ||
             order.guestInfo?.phone?.includes(searchLower);
    });
  }, [orders, searchTerm, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-[#FDF6B2] text-[#723B13] border-[#FCE96A]'; // Warm Yellow
      case 'Processing': return 'bg-[#E1EFFE] text-[#1E429F] border-[#B3D7FF]'; // Soft Blue
      case 'Shipped': return 'bg-[#EDEBFE] text-[#5521B5] border-[#D4C6FF]'; // Purple
      case 'Delivered': return 'bg-[#DEF7EC] text-[#03543F] border-[#84E1BC]'; // Green
      case 'Cancelled': return 'bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4]'; // Red
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center text-[#800000]">
      <div className="flex flex-col items-center gap-4">
         <Loader2 className="animate-spin" size={40}/>
         <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Loading Orders...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 w-full overflow-x-hidden pt-16 lg:pt-0">
      
      <CancelModal isOpen={!!cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(r) => { handleStatusChange(cancelOrderId, 'Cancelled', r); setCancelOrderId(null); }} />
      <FraudCheckModal isOpen={!!fraudCheckCustomer} onClose={() => setFraudCheckCustomer(null)} customer={fraudCheckCustomer} />

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-bodoni text-3xl font-bold text-black">Orders</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#800000]"></span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {filteredOrders.length} Records Found
                </p>
            </div>
          </div>
          <button 
            onClick={handleBulkShip} 
            disabled={bulkShipping}
            className="bg-[#800000] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-[#800000]/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 hover:-translate-y-0.5"
          >
            {bulkShipping ? <Loader2 className="animate-spin" size={14}/> : <Truck size={14}/>}
            Bulk Courier
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        
        {/* CONTROLS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#800000] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, Name, Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder:text-gray-400"
            />
          </div>
          
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 px-2 no-scrollbar">
            <div className="flex gap-2">
              {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button 
                  key={status} 
                  onClick={() => setStatusFilter(status)} 
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    statusFilter === status 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-black'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- ORDER CARDS (Responsive List) --- */}
        <div className="space-y-4">
           {filteredOrders.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 mx-auto">
                    <Package size={24} className="opacity-20 text-black" />
                 </div>
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No matching orders found</p>
              </div>
           ) : filteredOrders.map(order => (
              <motion.div 
                layout 
                key={order._id} 
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                 {/* MAIN ROW */}
                 <div 
                    className="p-5 flex flex-col lg:flex-row gap-6 lg:items-center cursor-pointer relative"
                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                 >
                    {/* Status Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'Cancelled' ? 'bg-[#800000]' : order.status === 'Delivered' ? 'bg-green-600' : 'bg-[#D4AF37]'}`}></div>

                    {/* ID & Status */}
                    <div className="flex items-center gap-4 lg:w-1/4 pl-2">
                       <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-[#800000] transition-colors border border-gray-100">
                          <Package size={18}/>
                       </div>
                       <div>
                          <h3 className="font-mono font-bold text-sm text-black tracking-wide">{formatOrderId(order.orderId)}</h3>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusStyle(order.status)}`}>
                             {order.status}
                          </span>
                       </div>
                    </div>

                    {/* Customer */}
                    <div className="lg:w-1/4">
                       <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                          <User size={14} className="text-[#D4AF37]"/>
                          {order.guestInfo?.firstName} {order.guestInfo?.lastName}
                       </div>
                       <div className="text-[10px] text-gray-400 font-medium mt-1 pl-6 uppercase tracking-wider">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                    </div>

                    {/* Quick Stats / Items */}
                    <div className="lg:w-1/4 flex items-center gap-8">
                       <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Items</p>
                          <p className="font-bold text-sm text-gray-900">{order.items.length}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Total</p>
                          <p className="font-bodoni font-bold text-lg text-[#800000] flex items-center gap-1"><Taka/>{order.totalAmount?.toLocaleString()}</p>
                       </div>
                    </div>

                    {/* Expand Toggle */}
                    <div className="ml-auto text-gray-300 group-hover:text-black transition-colors">
                       {expandedOrderId === order._id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                 </div>

                 {/* EXPANDED DETAILS */}
                 <AnimatePresence>
                    {expandedOrderId === order._id && (
                       <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="border-t border-gray-100 bg-[#faf9f6]/50"
                       >
                          <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                             
                             {/* LEFT: INFO */}
                             <div className="space-y-6">
                                {/* Shipping Info */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full -mr-6 -mt-6"></div>
                                   <div className="flex items-center gap-2 mb-4">
                                      <MapPin size={16} className="text-[#800000]"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Delivery Details</h4>
                                   </div>
                                   <div className="space-y-4 text-sm text-gray-600">
                                      <div className="flex justify-between border-b border-gray-50 pb-2">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Phone</span>
                                         <span className="font-mono font-bold text-black tracking-wide">{order.guestInfo?.phone}</span>
                                      </div>
                                      <div className="pt-1">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1 tracking-wide">Address</span>
                                         <p className="leading-relaxed text-black text-xs font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                                      </div>
                                   </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                   <div className="flex items-center gap-2 mb-4">
                                      <CreditCard size={16} className="text-[#800000]"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Payment</h4>
                                   </div>
                                   <div className="space-y-3 text-sm">
                                      <div className="flex justify-between text-gray-500 text-xs font-medium">
                                         <span>Subtotal</span>
                                         <span className="flex items-center gap-1 font-bold text-gray-800"><Taka/>{order.subTotal ? order.subTotal.toLocaleString() : order.totalAmount}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500 text-xs font-medium">
                                         <span>Shipping</span>
                                         <span className="flex items-center gap-1 font-bold text-gray-800"><Taka/>{order.shippingAddress?.method === 'outside' ? '150' : '80'}</span>
                                      </div>
                                      {order.discountAmount > 0 && (
                                         <div className="flex justify-between text-[#800000] bg-red-50 p-2 rounded text-[10px] font-bold uppercase border border-red-100">
                                            <span>Discount ({order.couponCode})</span>
                                            <span className="flex items-center gap-1">-<Taka size={10}/>{order.discountAmount.toLocaleString()}</span>
                                         </div>
                                      )}
                                      <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between font-bold text-black text-base">
                                         <span>Total Payable</span>
                                         <span className="font-bodoni text-[#800000] flex items-center gap-1"><Taka size={16}/>{order.totalAmount.toLocaleString()}</span>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             {/* MIDDLE & RIGHT: ITEMS & ACTIONS */}
                             <div className="xl:col-span-2 space-y-6">
                                {/* Items */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                   <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                                      <ShoppingBag size={14} className="text-gray-400"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Order Items</h4>
                                   </div>
                                   <div className="divide-y divide-gray-100">
                                      {order.items.map((item, i) => (
                                         <div key={i} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                                            <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                               <img src={item.image || '/placeholder.jpg'} className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                               <div className="flex justify-between items-start">
                                                  <div>
                                                     <p className="font-bold text-sm text-black line-clamp-1">{item.name}</p>
                                                     <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">Size: {item.size}</span>
                                                        <span className="text-xs text-gray-500 font-bold">x {item.quantity}</span>
                                                     </div>
                                                  </div>
                                                  <p className="font-bodoni font-bold text-base text-black flex items-center gap-1"><Taka/>{(item.price * item.quantity).toLocaleString()}</p>
                                               </div>
                                               {(item.sku || item.barcode) && (
                                                  <div className="mt-2 flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                                     {item.sku && <span className="text-[10px] font-mono bg-gray-100 px-1.5 rounded text-black border border-gray-200 tracking-wide">{item.sku}</span>}
                                                     {item.barcode && <div className="mix-blend-multiply opacity-80"><Barcode value={item.barcode} width={1} height={12} fontSize={0} displayValue={false} margin={0} /></div>}
                                                  </div>
                                               )}
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>

                                {/* Action Toolbar */}
                                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                   
                                   {/* Stage 1: Pending */}
                                   {order.status === 'Pending' && (
                                      <>
                                         <button onClick={() => setFraudCheckCustomer(order.guestInfo)} className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                                            <ShieldAlert size={14}/> Risk Check
                                         </button>
                                         <ActionButton onClick={() => handleStatusChange(order._id, 'Processing')} icon={<Package size={14}/>} label="Approve & Process" color="blue" />
                                      </>
                                   )}

                                   {/* Stage 2: Processing */}
                                   {order.status === 'Processing' && (
                                      <>
                                         {!order.consignment_id ? (
                                            <button onClick={() => handleShipToSteadfast(order._id)} disabled={shippingId === order._id} className="flex items-center gap-2 px-5 py-2.5 bg-[#800000] text-white hover:bg-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-[#800000]/20 disabled:opacity-70 disabled:cursor-not-allowed">
                                               {shippingId === order._id ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} 
                                               Send to Courier
                                            </button>
                                         ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-mono font-bold">
                                               <Truck size={14}/> {order.tracking_code}
                                            </div>
                                         )}
                                         <ActionButton onClick={() => handleStatusChange(order._id, 'Shipped')} icon={<Truck size={14}/>} label="Mark Shipped" color="purple" />
                                      </>
                                   )}

                                   {/* Stage 3: Shipped */}
                                   {order.status === 'Shipped' && (
                                      <ActionButton onClick={() => handleStatusChange(order._id, 'Delivered')} icon={<Check size={14}/>} label="Mark Delivered" color="green" />
                                   )}

                                   {/* Common: Cancel */}
                                   {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                      <button onClick={() => setCancelOrderId(order._id)} className="ml-auto px-4 py-2 text-[#800000] hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-red-100 transition-colors flex items-center gap-2">
                                         <X size={14}/> Cancel Order
                                      </button>
                                   )}
                                </div>
                             </div>

                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </motion.div>
           ))}
        </div>

      </div>
    </div>
  );
}

// Helper for Action Buttons
function ActionButton({ onClick, icon, label, color }) {
  const styles = { 
     blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', 
     purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200', 
     green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' 
  };
  return (
     <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${styles[color]}`}>
        {icon} <span>{label}</span>
     </button>
  );
}