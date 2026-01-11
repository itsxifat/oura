'use client';

import { useState, useEffect } from 'react';
import { syncAllUserOrders } from '@/actions/steadfast'; // ✅ Updated Import
import { Package, Truck, CheckCircle, Clock, MapPin, X, ShoppingBag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function DeliveryStatusPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        const data = await syncAllUserOrders();
        setOrders(data || []);
        setLoading(false);
    }
    loadData();
  }, []);

  // --- HELPER: Timeline Status Logic ---
  const getStepStatus = (orderStatus, step) => {
      const statusMap = { 'Pending': 1, 'Processing': 2, 'Shipped': 3, 'Delivered': 4, 'Cancelled': -1 };
      const current = statusMap[orderStatus] || 0;
      
      if (orderStatus === 'Cancelled') return 'red';
      if (current >= step) return 'green';
      return 'gray';
  };

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center font-manrope">
       <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Syncing with Courier...</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center font-manrope text-center px-4">
       <ShoppingBag size={40} className="text-gray-300 mb-4"/>
       <h2 className="text-2xl font-bodoni text-black">No Orders Found</h2>
       <p className="text-sm text-gray-500 mt-2 mb-6">You haven't placed any orders yet.</p>
       <Link href="/product" className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors">
          Start Shopping
       </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="mb-8">
           <h1 className="font-bodoni text-3xl md:text-4xl text-black">My Orders</h1>
           <p className="text-gray-500 text-sm mt-1">Real-time delivery updates from our partners.</p>
        </div>

        {/* ORDER LIST */}
        <AnimatePresence mode='popLayout'>
            {orders.map((order, index) => (
                <motion.div 
                    key={order._id}
                    initial={{opacity:0, y:20}} 
                    animate={{opacity:1, y:0}} 
                    transition={{delay: index * 0.1}}
                    className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded">#{order.orderId}</span>
                                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                                {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'} • Total: ৳{order.totalAmount.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            {order.tracking_code ? (
                                <span className="text-[10px] font-mono bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                    Track: {order.tracking_code}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase text-gray-400">Processing</span>
                            )}
                        </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="relative pl-4 space-y-8">
                        <div className="absolute top-2 left-[19px] h-[calc(100%-20px)] w-0.5 bg-gray-100 -z-0"></div>

                        <TimelineItem 
                            active={getStepStatus(order.status, 1) === 'green'} 
                            icon={<Package size={16}/>} 
                            title="Order Placed" 
                            desc="We have received your order."
                        />

                        <TimelineItem 
                            active={getStepStatus(order.status, 2) === 'green'} 
                            icon={<Clock size={16}/>} 
                            title="Processing" 
                            desc="We are packing your items."
                        />

                        <TimelineItem 
                            active={getStepStatus(order.status, 3) === 'green'} 
                            icon={<Truck size={16}/>} 
                            title="On The Way" 
                            desc={order.courier_status && order.courier_status !== 'in_review' 
                                ? `Courier Status: ${order.courier_status.replace(/_/g, ' ').toUpperCase()}` 
                                : "Handed over to courier partner."}
                        />

                        <TimelineItem 
                            active={getStepStatus(order.status, 4) === 'green'} 
                            icon={<CheckCircle size={16}/>} 
                            title="Delivered" 
                            desc="Package successfully delivered."
                            isLast
                        />

                        {/* Cancelled Overlay */}
                        {order.status === 'Cancelled' && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-full font-bold border border-red-200 flex items-center gap-2 shadow-sm">
                                    <X size={18}/> Order Cancelled
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ITEM PREVIEW */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Items</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex-shrink-0 w-12 h-16 bg-gray-50 border border-gray-200 rounded overflow-hidden" title={`${item.name} (${item.size})`}>
                                    <img src={item.image || '/placeholder.jpg'} className="w-full h-full object-cover"/>
                                </div>
                            ))}
                        </div>
                    </div>

                </motion.div>
            ))}
        </AnimatePresence>

      </div>
    </div>
  );
}

const TimelineItem = ({ active, icon, title, desc, isLast }) => (
  <div className="relative z-10 flex gap-4">
     <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${active ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
        {icon}
     </div>
     <div className={`flex-1 ${isLast ? '' : 'pb-2'}`}>
        <h4 className={`font-bold text-sm ${active ? 'text-black' : 'text-gray-400'}`}>{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
     </div>
  </div>
);