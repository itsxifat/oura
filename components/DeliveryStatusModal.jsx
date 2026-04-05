'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Package, Truck, CheckCircle, Clock, MapPin, RefreshCw, Copy, Check, Loader2, XCircle, Sparkles } from 'lucide-react';
import { syncOrderCourierStatus } from '@/actions/steadfast';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString('en-BD');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// Maps courier_status → human label + colour
const COURIER_INFO = {
  in_review:        { label: 'Package accepted',      color: '#8B5CF6', dot: 'bg-violet-400' },
  pending:          { label: 'Awaiting pickup',        color: '#F59E0B', dot: 'bg-amber-400' },
  in_transit:       { label: 'In transit',             color: '#3B82F6', dot: 'bg-blue-400' },
  out_for_delivery: { label: 'Out for delivery today!', color: '#10B981', dot: 'bg-emerald-400' },
  delivered:        { label: 'Successfully delivered', color: '#10B981', dot: 'bg-emerald-400' },
  partial_delivered:{ label: 'Partially delivered',   color: '#F59E0B', dot: 'bg-amber-400' },
  cancelled:        { label: 'Delivery cancelled',     color: '#EF4444', dot: 'bg-red-400' },
  hold:             { label: 'Package on hold',        color: '#F59E0B', dot: 'bg-amber-400' },
  pending_return:   { label: 'Return in progress',     color: '#EF4444', dot: 'bg-red-400' },
};

// Main status → step index (1-4)
const STATUS_STEP = { Pending: 1, Processing: 2, Shipped: 3, Delivered: 4 };

// ─── confetti particle ────────────────────────────────────────────────────────
const Particle = ({ index, total }) => {
  const angle   = (index / total) * 360;
  const dist    = 80 + Math.random() * 120;
  const size    = 4 + Math.random() * 8;
  const colors  = ['#B91C1C', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F472B6', '#FFFFFF'];
  const color   = colors[index % colors.length];
  const radians = (angle * Math.PI) / 180;
  const tx      = Math.cos(radians) * dist;
  const ty      = Math.sin(radians) * dist;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, top: '50%', left: '50%', marginTop: -size / 2, marginLeft: -size / 2 }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{ scale: [0, 1, 0.8, 0], x: [0, tx * 0.5, tx], y: [0, ty * 0.5, ty], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.2 + Math.random() * 0.8, ease: 'easeOut', delay: Math.random() * 0.4 }}
    />
  );
};

const DeliveryConfetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
    {Array.from({ length: 48 }).map((_, i) => <Particle key={i} index={i} total={48} />)}
  </div>
);

// ─── timeline step ────────────────────────────────────────────────────────────
const TimelineStep = ({ step, currentStep, icon, label, subLabel, isCancelled, isLast, courierInfo }) => {
  const isActive  = !isCancelled && currentStep >= step;
  const isCurrent = !isCancelled && currentStep === step;

  return (
    <div className="relative flex gap-5 items-start">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10 overflow-hidden">
          <motion.div
            className="w-full bg-gradient-to-b from-white/40 to-white/10"
            initial={{ height: 0 }}
            animate={{ height: isActive ? '100%' : 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Icon node */}
      <div className="relative flex-shrink-0 z-10">
        <motion.div
          animate={isCancelled ? { scale: 1 } : isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
            ${isCancelled && step === currentStep ? 'bg-red-500/20 border-red-500 text-red-400' :
              isActive ? 'bg-white/10 border-white/60 text-white' :
              'bg-white/[0.03] border-white/10 text-white/20'}`}
        >
          {icon}
        </motion.div>
        {/* Pulse ring for current step */}
        {isCurrent && !isCancelled && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 pb-8">
        <motion.p
          animate={{ opacity: isActive ? 1 : 0.3 }}
          className={`font-heading font-black text-sm uppercase tracking-wider mb-1 transition-colors ${
            isCancelled && step === currentStep ? 'text-red-400' : isActive ? 'text-white' : 'text-white/30'
          }`}
        >
          {label}
        </motion.p>
        <motion.p
          animate={{ opacity: isActive ? 1 : 0.2 }}
          className="text-[11px] text-white/50 leading-relaxed"
        >
          {isCurrent && courierInfo ? courierInfo.label : subLabel}
        </motion.p>
        {/* Live courier badge */}
        {isCurrent && courierInfo && !isCancelled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
            style={{ background: `${courierInfo.color}20`, color: courierInfo.color, border: `1px solid ${courierInfo.color}40` }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${courierInfo.dot} animate-pulse`} />
            Live: {courierInfo.label}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── main modal ───────────────────────────────────────────────────────────────
export default function DeliveryStatusModal({ order: initialOrder, onClose, isPage = false, onRefreshFromServer }) {
  const [order, setOrder]         = useState(initialOrder);
  const [syncing, setSyncing]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef(initialOrder?.status);
  const intervalRef = useRef(null);

  const isCancelled = order?.status === 'Cancelled';
  const isDelivered = order?.status === 'Delivered';
  const currentStep = isCancelled
    ? (STATUS_STEP[order?.status === 'Cancelled' ? (order?.consignment_id ? 'Shipped' : 'Processing') : 'Pending'] ?? 1)
    : (STATUS_STEP[order?.status] ?? 1);

  const courierInfo = order?.courier_status ? COURIER_INFO[order.courier_status.toLowerCase()] : null;

  // Show confetti when status changes to Delivered
  useEffect(() => {
    if (order?.status === 'Delivered' && prevStatus.current !== 'Delivered') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
    prevStatus.current = order?.status;
  }, [order?.status]);

  // Show confetti on initial load if already delivered
  useEffect(() => {
    if (initialOrder?.status === 'Delivered') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = useCallback(async () => {
    if (!order?._id || syncing) return;
    setSyncing(true);
    try {
      const res = await syncOrderCourierStatus(order._id);
      if (res.success) {
        setOrder(prev => ({
          ...prev,
          courier_status: res.courier_status,
          status: res.status,
          courier_synced_at: res.synced_at,
        }));
      }
      // Also trigger parent refresh if provided
      if (onRefreshFromServer) onRefreshFromServer();
    } catch { /* non-fatal */ }
    setSyncing(false);
  }, [order, syncing, onRefreshFromServer]);

  // Auto-refresh every 90s when in transit
  useEffect(() => {
    if (!order?._id || isDelivered || isCancelled) return;
    if (!order?.consignment_id) return;
    intervalRef.current = setInterval(handleSync, 90000);
    return () => clearInterval(intervalRef.current);
  }, [order, isDelivered, isCancelled, handleSync]);

  const copyTracking = () => {
    if (!order?.tracking_code) return;
    navigator.clipboard.writeText(order.tracking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) return null;

  const steps = [
    { step: 1, icon: <Package size={16}/>,     label: 'Order Placed',  subLabel: `Placed on ${fmtDate(order.createdAt)}` },
    { step: 2, icon: <Clock size={16}/>,        label: 'Processing',    subLabel: 'Your order is being prepared' },
    { step: 3, icon: <Truck size={16}/>,        label: 'On the Way',    subLabel: 'Handed to courier partner' },
    { step: 4, icon: <CheckCircle size={16}/>,  label: 'Delivered',     subLabel: 'Package delivered successfully', isLast: true },
  ];

  const content = (
    <div className={`relative flex flex-col ${isPage ? 'min-h-screen' : 'max-h-[92vh]'} bg-[#0a0a0a] overflow-hidden`}>

      {/* Ambient glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
        isDelivered ? 'bg-emerald-900/40' : isCancelled ? 'bg-red-900/30' : 'bg-[#B91C1C]/20'
      }`} />

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <DeliveryConfetti />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between p-6 sm:p-8 flex-shrink-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/30 mb-1">Delivery Status</p>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            {order.orderId}
          </h2>
          <p className="text-[10px] text-white/30 mt-1 font-medium">
            {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
          </p>
        </motion.div>

        <div className="flex items-center gap-2">
          {/* Sync button */}
          {order.consignment_id && !isDelivered && !isCancelled && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={handleSync}
              disabled={syncing}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30"
              title="Refresh status"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            </motion.button>
          )}
          {/* Close */}
          {!isPage && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Status hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 px-6 sm:px-8 mb-6 flex-shrink-0"
      >
        <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 border ${
          isDelivered ? 'bg-emerald-950/60 border-emerald-800/40' :
          isCancelled ? 'bg-red-950/50 border-red-900/30' :
          'bg-white/[0.04] border-white/[0.08]'
        }`}>
          {/* Status icon + label */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDelivered ? 'bg-emerald-500/20' :
              isCancelled ? 'bg-red-500/20' :
              'bg-white/10'
            }`}>
              {isDelivered  ? <CheckCircle size={22} className="text-emerald-400" /> :
               isCancelled  ? <XCircle size={22} className="text-red-400" /> :
               currentStep >= 3 ? <Truck size={22} className="text-white/70" /> :
               currentStep >= 2 ? <Clock size={22} className="text-white/70" /> :
               <Package size={22} className="text-white/70" />}
            </div>
            <div>
              <p className={`font-heading font-black text-xl sm:text-2xl uppercase tracking-tight ${
                isDelivered ? 'text-emerald-400' : isCancelled ? 'text-red-400' : 'text-white'
              }`}>
                {isDelivered ? 'Delivered!' :
                 isCancelled ? 'Cancelled' :
                 order.status}
              </p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest mt-0.5">
                {isDelivered ? 'Your package has arrived' :
                 isCancelled ? 'This order was cancelled' :
                 courierInfo ? courierInfo.label :
                 'Status update in progress'}
              </p>
            </div>
          </div>

          {/* Tracking code */}
          {order.tracking_code && (
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/8">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-0.5">Tracking ID</p>
                <p className="font-mono font-bold text-sm text-white">{order.tracking_code}</p>
              </div>
              <button
                onClick={copyTracking}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          )}

          {/* Sync time */}
          {order.courier_synced_at && (
            <p className="text-[9px] text-white/20 font-mono mt-3 text-right">
              Synced {fmtTime(order.courier_synced_at)}
            </p>
          )}
        </div>
      </motion.div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 pb-8 space-y-6">

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-6">Journey</p>
          {steps.map(({ step, icon, label, subLabel, isLast }) => (
            <TimelineStep
              key={step}
              step={step}
              currentStep={currentStep}
              icon={icon}
              label={label}
              subLabel={subLabel}
              isLast={isLast}
              isCancelled={isCancelled && step === currentStep}
              courierInfo={step === 3 ? courierInfo : null}
            />
          ))}
        </motion.div>

        {/* Delivery address */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={13} className="text-white/30" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25">Delivering to</p>
          </div>
          <p className="text-sm font-bold text-white/70">
            {order.guestInfo?.firstName} {order.guestInfo?.lastName}
          </p>
          <p className="text-xs text-white/35 mt-1 leading-relaxed">
            {order.shippingAddress?.address}, {order.shippingAddress?.city}
          </p>
          <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
            {order.shippingAddress?.method === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka'}
          </span>
        </motion.div>

        {/* Items preview */}
        {order.items?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-4">
              Package Contents · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/8 flex-shrink-0">
                    <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/70 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.size && item.size !== 'STD' && (
                        <span className="text-[9px] font-black uppercase tracking-wide text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{item.size}</span>
                      )}
                      <span className="text-[9px] text-white/25 font-medium">× {item.quantity}</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white/50 flex-shrink-0">৳{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Delivered celebration card */}
        {isDelivered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-950 to-[#0a0a0a] border border-emerald-800/40 rounded-2xl p-6 text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="font-heading font-black text-xl text-emerald-400 uppercase tracking-tight mb-1">Enjoy your order!</h3>
              <p className="text-[11px] text-white/30">Thank you for shopping with Oura Lifestyle</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  if (isPage) return content;

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      {/* Panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full sm:max-w-lg sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {content}
      </motion.div>
    </div>
  );
}
