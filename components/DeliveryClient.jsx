'use client';

import { useState, useEffect } from 'react';
import { syncAllUserOrders } from '@/actions/steadfast'; 
import { Package, Truck, CheckCircle, Clock, MapPin, X, ShoppingBag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function DeliveryClient() {
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
      if (current >= step) return 'active';
      return 'inactive';
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-manrope">
       <Loader2 size={40} className="text-[#B91C1C] animate-spin mb-4"/>
       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Syncing Data...</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-manrope text-center px-4">
       <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
          <ShoppingBag size={32}/>
       </div>
       <h2 className="text-3xl font-bodoni text-black mb-2">No Orders Yet</h2>
       <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">Your collection awaits. Start your journey with us today.</p>
       <Link href="/products" className="bg-black text-white px-8 py-4 rounded-md text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#B91C1C] transition-colors shadow-lg">
          Start Shopping
       </Link>
    </div>
  );

  return (
    <div className="bg-white font-manrope py-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        
        <div className="text-center md:text-left border-b border-gray-100 pb-8">
           <h1 className="font-bodoni text-4xl md:text-5xl text-black mb-2">My Orders</h1>
           <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Live Delivery Status</p>
        </div>

        {/* ORDER LIST */}
        <AnimatePresence mode='popLayout'>
            {orders.map((order, index) => (
                <motion.div 
                    key={order._id}
                    initial={{opacity:0, y:20}} 
                    animate={{opacity:1, y:0}} 
                    transition={{delay: index * 0.1}}
                    className="group bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-[#B91C1C]/30 hover:shadow-xl hover:shadow-[#B91C1C]/5 transition-all duration-500"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full tracking-wide">#{order.orderId}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-600">
                                {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'} • <span className="text-black font-bold">৳{order.totalAmount.toLocaleString()}</span>
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            {order.tracking_code ? (
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Tracking ID</p>
                                    <span className="font-mono text-xs font-bold text-[#B91C1C] bg-[#B91C1C]/5 px-3 py-1 rounded border border-[#B91C1C]/20">
                                        {order.tracking_code}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded">Processing</span>
                            )}
                        </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="relative pl-2 md:pl-4 space-y-10">
                        {/* Connecting Line */}
                        <div className="absolute top-2 left-[27px] md:left-[35px] h-[calc(100%-20px)] w-[1px] bg-gray-100 -z-0"></div>

                        <TimelineItem 
                            status={getStepStatus(order.status, 1)} 
                            icon={<Package size={14}/>} 
                            title="Order Placed" 
                            desc="We have received your order."
                        />

                        <TimelineItem 
                            status={getStepStatus(order.status, 2)} 
                            icon={<Clock size={14}/>} 
                            title="Processing" 
                            desc="We are packing your items."
                        />

                        <TimelineItem 
                            status={getStepStatus(order.status, 3)} 
                            icon={<Truck size={14}/>} 
                            title="On The Way" 
                            desc={order.courier_status && order.courier_status !== 'in_review' 
                                ? `Courier: ${order.courier_status.replace(/_/g, ' ').toUpperCase()}` 
                                : "Handed over to courier partner."}
                        />

                        <TimelineItem 
                            status={getStepStatus(order.status, 4)} 
                            icon={<CheckCircle size={14}/>} 
                            title="Delivered" 
                            desc="Package successfully delivered."
                            isLast
                        />

                        {/* Cancelled Overlay */}
                        {order.status === 'Cancelled' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                                <div className="bg-red-50 text-[#B91C1C] px-8 py-4 rounded-full font-bold border border-[#B91C1C]/20 flex items-center gap-3 shadow-lg">
                                    <X size={20}/> Order Cancelled
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ITEM PREVIEW */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[9px] font-bold uppercase text-gray-400 mb-4 tracking-widest">Package Contents</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {order.items.map((item, i) => (
                                <div key={i} className="group/item relative flex-shrink-0 w-16 h-20 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden cursor-help">
                                    <img src={item.image || '/placeholder.jpg'} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"/>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[8px] text-white font-bold uppercase">{item.size}</span>
                                    </div>
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

const TimelineItem = ({ status, icon, title, desc, isLast }) => {
    const isActive = status === 'active';
    
    return (
      <div className="relative z-10 flex gap-6">
         <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm ${
             isActive 
             ? 'bg-[#B91C1C] border-[#B91C1C] text-white shadow-md shadow-[#B91C1C]/20 scale-110' 
             : 'bg-white border-gray-100 text-gray-300'
         }`}>
            {icon}
         </div>
         <div className={`flex-1 pt-1 ${isLast ? '' : 'pb-2'}`}>
            <h4 className={`font-bold text-sm tracking-wide transition-colors ${isActive ? 'text-black' : 'text-gray-400'}`}>{title}</h4>
            <p className={`text-xs mt-1 transition-colors ${isActive ? 'text-gray-600' : 'text-gray-300'}`}>{desc}</p>
         </div>
      </div>
    );
};