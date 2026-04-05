'use client';

import { useState, useEffect } from 'react';
import { syncAllUserOrders } from '@/actions/steadfast';
import { Package, Truck, CheckCircle, Clock, MapPin, X, ShoppingBag, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import DeliveryStatusModal from './DeliveryStatusModal';

const STATUS_STEP = { Pending: 1, Processing: 2, Shipped: 3, Delivered: 4 };
const STATUS_COLOR = {
  Pending:    { bg: 'bg-amber-400/10',  text: 'text-amber-400',  border: 'border-amber-400/20' },
  Processing: { bg: 'bg-blue-400/10',   text: 'text-blue-400',   border: 'border-blue-400/20' },
  Shipped:    { bg: 'bg-violet-400/10', text: 'text-violet-400', border: 'border-violet-400/20' },
  Delivered:  { bg: 'bg-emerald-400/10',text: 'text-emerald-400',border: 'border-emerald-400/20' },
  Cancelled:  { bg: 'bg-red-400/10',    text: 'text-red-400',    border: 'border-red-400/20' },
};

export default function DeliveryClient() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [trackOrder, setTrackOrder] = useState(null);

  const load = async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    const data = await syncAllUserOrders();
    setOrders(data || []);
    setLoading(false);
    setSyncing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-[70vh] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full border-2 border-t-[#B91C1C] border-white/10"
      />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Syncing deliveries…</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-[70vh] bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-6">
        <ShoppingBag size={28} className="text-white/20" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="font-heading font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mb-3">
        No Orders Yet
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-sm text-white/30 mb-8 max-w-xs">
        Your collection awaits.
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Link href="/products"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-neutral-100 transition-colors rounded-xl">
          Start Shopping <ArrowRight size={13} />
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6">
      <AnimatePresence>
        {trackOrder && (
          <DeliveryStatusModal
            order={trackOrder}
            onClose={() => setTrackOrder(null)}
            onRefreshFromServer={() => load()}
          />
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-10 border-b border-white/[0.07] pb-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#B91C1C] mb-2">Live Updates</p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-white uppercase tracking-tight leading-none">
              My Deliveries
            </h1>
          </div>
          <button
            onClick={() => load(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            Sync All
          </button>
        </motion.div>

        {/* Order cards */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => {
              const sc       = STATUS_COLOR[order.status] ?? STATUS_COLOR.Pending;
              const step     = STATUS_STEP[order.status] ?? 1;
              const progress = ((step - 1) / 3) * 100;
              const cleanId  = (order.orderId || '').replace('#', '');

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300"
                >
                  {/* Progress bar */}
                  <div className="h-0.5 bg-white/5">
                    <motion.div
                      className={`h-full ${order.status === 'Cancelled' ? 'bg-red-500' : order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-[#B91C1C]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${order.status === 'Cancelled' ? 100 : progress}%` }}
                      transition={{ duration: 1, delay: index * 0.06 + 0.3, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono font-black text-sm text-white tracking-wide">{order.orderId}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 font-medium">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} ·
                          <span className="text-white/50 font-bold ml-1">৳{Number(order.totalAmount || 0).toLocaleString('en-BD')}</span>
                        </p>
                      </div>
                      {order.tracking_code && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[8px] uppercase tracking-[0.25em] text-white/20 mb-1">Tracking</p>
                          <span className="font-mono text-[11px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 px-2.5 py-1 rounded-lg border border-[#B91C1C]/20">
                            {order.tracking_code}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mini timeline dots */}
                    <div className="flex items-center gap-0 mb-5">
                      {[
                        { s: 1, icon: <Package size={10}/>,      label: 'Placed' },
                        { s: 2, icon: <Clock size={10}/>,         label: 'Processing' },
                        { s: 3, icon: <Truck size={10}/>,         label: 'In Transit' },
                        { s: 4, icon: <CheckCircle size={10}/>,  label: 'Delivered' },
                      ].map(({ s, icon, label }, i) => {
                        const active = !order.status === 'Cancelled' && step >= s;
                        const isCancelledStep = order.status === 'Cancelled' && s === step;
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                isCancelledStep ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                                (step >= s && order.status !== 'Cancelled') ? 'bg-white/10 border-white/40 text-white' :
                                'bg-white/[0.03] border-white/[0.08] text-white/15'
                              }`}>
                                {icon}
                              </div>
                              <span className={`text-[7px] font-black uppercase tracking-wide whitespace-nowrap ${
                                (step >= s && order.status !== 'Cancelled') ? 'text-white/50' : 'text-white/15'
                              }`}>{label}</span>
                            </div>
                            {i < 3 && (
                              <div className="flex-1 h-px mx-1 mb-4 bg-white/[0.06] overflow-hidden">
                                <motion.div
                                  className={`h-full ${order.status === 'Delivered' ? 'bg-emerald-500/40' : 'bg-white/20'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: step > s ? '100%' : 0 }}
                                  transition={{ duration: 0.6, delay: index * 0.06 + 0.5 + i * 0.1 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Item thumbnails */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex -space-x-2">
                        {order.items?.slice(0, 4).map((item, i) => (
                          <div key={i} className="w-9 h-11 rounded-lg overflow-hidden border-2 border-[#0a0a0a] bg-white/5 flex-shrink-0">
                            <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover opacity-80" />
                          </div>
                        ))}
                        {order.items?.length > 4 && (
                          <div className="w-9 h-11 rounded-lg bg-white/5 border-2 border-[#0a0a0a] flex items-center justify-center">
                            <span className="text-[8px] font-black text-white/30">+{order.items.length - 4}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-white/20 ml-1 flex-1 truncate">
                        {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                        {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                      </p>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackOrder(order)}
                        className="flex-1 h-10 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.18] text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Truck size={12} /> Track Order
                      </button>
                      <Link
                        href={`/delivery-status/${cleanId}`}
                        className="h-10 px-4 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.18] text-white/40 hover:text-white/70 rounded-xl transition-all flex items-center justify-center"
                        title="Open full page"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
