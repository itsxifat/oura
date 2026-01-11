'use client';

import React, { useEffect, useState, useMemo } from 'react'; 
import { getAdminOrders, updateOrderStatus } from '@/app/actions';
import { checkFraud } from '@/actions/fraud'; 
import { sendToSteadfast, bulkShipToSteadfast } from '@/actions/steadfast'; // ✅ Correct Import Path
import { 
  Package, Truck, Check, X, Search, 
  ChevronDown, ChevronUp, MapPin, 
  User, CreditCard, ShoppingBag, 
  ShieldAlert, Activity, TicketPercent, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast'; 

// --- FRAUD CHECK MODAL ---
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-manrope max-h-[90vh] overflow-y-auto">
        
        <div className="bg-black text-white p-5 flex justify-between items-center sticky top-0 z-10">
           <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Risk Analysis</span>
              <h3 className="font-bodoni text-xl text-white">{customer?.firstName}</h3>
           </div>
           <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                 <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-xs font-bold uppercase mt-4 text-gray-400">Checking Databases...</p>
              </div>
           ) : data ? (
              <>
                 {/* CRITICAL ALERTS */}
                 {data.sources.steadfast.frauds && data.sources.steadfast.frauds.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                       <div className="flex gap-3 items-start mb-2">
                          <ShieldAlert size={24} className="text-red-600 shrink-0"/>
                          <div>
                             <h4 className="font-bold text-red-700">FRAUD RECORD FOUND</h4>
                             <p className="text-xs text-red-600">Flagged in courier database.</p>
                          </div>
                       </div>
                       <div className="space-y-2 mt-2">
                          {data.sources.steadfast.frauds.map((f, i) => (
                             <div key={i} className="text-[11px] bg-white p-2 rounded border border-red-100 text-gray-700">
                                {f.details || "No details."}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* SCORE */}
                 <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className={`text-3xl font-bold ${data.score < 50 ? 'text-red-600' : 'text-green-600'}`}>{data.score}%</div>
                    <div className="flex-1 border-l border-gray-200 pl-4">
                       <h4 className="font-bold text-sm uppercase text-gray-800">{data.level} Risk</h4>
                       <p className="text-xs text-gray-500 leading-tight mt-0.5">{data.suggestion}</p>
                    </div>
                 </div>

                 {/* STATS */}
                 <div className="border rounded-lg overflow-hidden">
                    <StatRow label="Internal History" data={data.sources.internal} />
                    <StatRow label="Steadfast (Global)" data={getSteadfastStats()} />
                    <StatRow label="Pathao Courier" data={data.sources.pathao} />
                 </div>
              </>
           ) : (
             <div className="text-center py-10">
                <ShieldAlert size={40} className="mx-auto text-red-400 mb-2"/>
                <p className="text-sm font-bold text-gray-600">Analysis Unavailable</p>
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
    <div className="flex justify-between items-center text-sm p-3 border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50 transition-colors">
       <div className="font-bold text-gray-700 w-1/3">{label}</div>
       <div className="flex gap-4 w-2/3 justify-end">
          <div className="text-center">
             <span className="block font-bold text-gray-900">{data.total || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase">Total</span>
          </div>
          <div className="text-center">
             <span className="block font-bold text-green-600">{data.delivered || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase">Success</span>
          </div>
          <div className="text-center">
             <span className="block font-bold text-red-600">{data.returned || 0}</span>
             <span className="text-[9px] text-gray-400 uppercase">Return</span>
          </div>
       </div>
    </div>
  );
};

// --- CANCELLATION MODAL ---
const CancelModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const reasons = ["Customer Request", "Product Out of Stock", "Duplicate Order", "Fraudulent", "Other"];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bodoni text-xl text-black mb-4">Cancel Order</h3>
        <div className="space-y-2">
           {reasons.map((reason) => (
              <button key={reason} onClick={() => onConfirm(reason)} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold transition-colors">
                {reason}
              </button>
           ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-xs text-gray-400 font-bold uppercase hover:text-black">Dismiss</button>
      </motion.div>
    </div>
  );
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Action Loading States
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

  // --- NEW: SHIP SINGLE ORDER ---
  const handleShipToSteadfast = async (id) => {
      setShippingId(id);
      try {
          const res = await sendToSteadfast(id);
          if(res.success) {
              toast.success(`Sent to Courier! Tracking: ${res.tracking_code}`);
              loadOrders();
          } else {
              toast.error(res.error || "Failed to send");
          }
      } catch (e) {
          console.error(e);
          toast.error("Network Error: Could not reach server");
      }
      setShippingId(null);
  };

  // --- NEW: BULK SHIP ---
  const handleBulkShip = async () => {
      if(!confirm("Send ALL 'Processing' orders to Steadfast?")) return;
      setBulkShipping(true);
      try {
          const res = await bulkShipToSteadfast();
          if(res.success) {
              toast.success(`Success! Shipped ${res.count || 'multiple'} orders.`);
              loadOrders();
          } else {
              toast.error(res.error || "Bulk ship failed");
          }
      } catch(e) {
          toast.error("Bulk Ship Network Error");
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
      return order.orderId?.toLowerCase().includes(searchLower) || 
             (order.guestInfo?.firstName + ' ' + order.guestInfo?.lastName).toLowerCase().includes(searchLower) ||
             order.guestInfo?.phone?.includes(searchLower);
    });
  }, [orders, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] p-8 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope">
      
      <CancelModal isOpen={!!cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(r) => { handleStatusChange(cancelOrderId, 'Cancelled', r); setCancelOrderId(null); }} />
      <FraudCheckModal isOpen={!!fraudCheckCustomer} onClose={() => setFraudCheckCustomer(null)} customer={fraudCheckCustomer} />

      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-bodoni text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all customer orders.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleBulkShip} 
                disabled={bulkShipping}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#D4AF37] transition-colors disabled:opacity-50 flex items-center gap-2"
             >
                {bulkShipping ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> : <Truck size={16}/>}
                Bulk Ship to Steadfast
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Order ID, Customer, Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === status ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th className="p-5 w-10"></th>
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Customer</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Total</th>
                  <th className="p-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length === 0 ? (
                   <tr><td colSpan="7" className="p-10 text-center text-gray-400">No orders found.</td></tr>
                ) : filteredOrders.map(order => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${expandedOrderId === order._id ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                    >
                      <td className="p-5 text-gray-400">{expandedOrderId === order._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td>
                      <td className="p-5 font-bold text-gray-900 font-mono">#{order.orderId}</td>
                      <td className="p-5 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-gray-900">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{order.guestInfo?.phone}</div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>{order.status}</span>
                      </td>
                      <td className="p-5 font-bodoni font-bold text-base">৳{order.totalAmount?.toLocaleString()}</td>
                      <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                            {order.status === 'Pending' && (
                               <button onClick={() => setFraudCheckCustomer(order.guestInfo)} className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200">
                                 <ShieldAlert size={16} />
                               </button>
                            )}

                            {order.status === 'Processing' && !order.consignment_id && (
                                <button 
                                    onClick={() => handleShipToSteadfast(order._id)}
                                    disabled={shippingId === order._id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {shippingId === order._id ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"/> : <Send size={14}/>}
                                    <span>Courier</span>
                                </button>
                            )}

                            {order.consignment_id && (
                                <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300 flex items-center gap-1" title="Tracking ID">
                                    <Truck size={10} className="text-gray-400"/>
                                    {order.tracking_code}
                                </span>
                            )}

                            {order.status === 'Pending' && <ActionButton onClick={() => handleStatusChange(order._id, 'Processing')} icon={<Package size={14}/>} label="Process" color="blue" />}
                            {order.status === 'Processing' && <ActionButton onClick={() => handleStatusChange(order._id, 'Shipped')} icon={<Truck size={14}/>} label="Ship" color="purple" />}
                            {order.status === 'Shipped' && <ActionButton onClick={() => handleStatusChange(order._id, 'Delivered')} icon={<Check size={14}/>} label="Complete" color="green" />}
                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button onClick={() => setCancelOrderId(order._id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                                <X size={16}/>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedOrderId === order._id && (
                        <tr className="bg-gray-50/50">
                          <td colSpan="7" className="p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-100">
                                <div className="space-y-6">
                                   <div>
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3"><User size={14}/> Customer Details</h4>
                                      <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm space-y-1">
                                         <p><span className="text-gray-400">Name:</span> {order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                                         <p><span className="text-gray-400">Phone:</span> {order.guestInfo?.phone}</p>
                                         <p className="mt-2 text-gray-800 leading-snug">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                                      </div>
                                   </div>
                                   <div>
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3"><CreditCard size={14}/> Payment Breakdown</h4>
                                      <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm space-y-2">
                                         <div className="flex justify-between text-gray-500">
                                            <span>Subtotal</span>
                                            <span>৳{order.subTotal ? order.subTotal.toLocaleString() : order.totalAmount}</span>
                                         </div>
                                         {order.discountAmount > 0 && (
                                            <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded">
                                               <div className="flex items-center gap-2"><TicketPercent size={14}/><span className="text-xs font-bold uppercase">{order.couponCode || "DISCOUNT"}</span></div>
                                               <span className="font-bold">-৳{order.discountAmount.toLocaleString()}</span>
                                            </div>
                                         )}
                                         <div className="flex justify-between text-gray-500">
                                            <span>Shipping</span>
                                            <span>৳{order.shippingAddress?.method === 'outside' ? '150' : '80'}</span>
                                         </div>
                                         <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-black text-base">
                                            <span>Total (COD)</span>
                                            <span>৳{order.totalAmount.toLocaleString()}</span>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                <div className="space-y-4 col-span-2">
                                   <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><ShoppingBag size={14}/> Order Items ({order.items.length})</h4>
                                   <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                      {order.items.map((item, i) => (
                                        <div key={i} className="p-4 flex items-start gap-4">
                                           <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                              <img src={item.image || '/placeholder.jpg'} className="w-full h-full object-cover"/>
                                           </div>
                                           <div className="flex-1 min-w-0">
                                              <div className="flex justify-between items-start">
                                                 <div>
                                                    <p className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                      <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">Size: {item.size || "STD"}</span>
                                                      <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                                                    </div>
                                                 </div>
                                                 <div className="text-right">
                                                    <p className="font-bold text-sm">৳{(item.price * item.quantity).toLocaleString()}</p>
                                                    {item.basePrice > item.price && (<p className="text-[10px] text-gray-400 line-through">৳{item.basePrice * item.quantity}</p>)}
                                                 </div>
                                              </div>
                                              <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-4">
                                                 {item.sku && (<div className="flex flex-col"><span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">SKU</span><span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{item.sku}</span></div>)}
                                                 {item.barcode && (<div className="flex flex-col"><span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Scan</span><div className="mix-blend-multiply opacity-90 scale-90 origin-left border border-gray-100 bg-white px-1 pt-1 rounded"><Barcode value={item.barcode} width={1} height={25} fontSize={10} displayValue={false} background="transparent" margin={0} /></div></div>)}
                                              </div>
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100', purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100', green: 'bg-green-50 text-green-600 hover:bg-green-100' };
  return <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${colors[color]}`}>{icon} <span>{label}</span></button>;
}