'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getAdminOrders, updateOrderStatus } from '@/app/actions';
import { checkFraud } from '@/actions/fraud';
import { sendToSteadfast, bulkShipToSteadfast, syncOrderCourierStatus } from '@/actions/steadfast';
import DeliveryStatusModal from '@/components/DeliveryStatusModal';
import {
  Package, Truck, Check, X, ChevronDown, ChevronUp,
  MapPin, User, CreditCard, ShoppingBag, ShieldAlert,
  Send, Loader2, AlertCircle, Banknote, CheckCircle2,
  Clock, Hash, Phone, Calendar, Navigation,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Barcode from 'react-barcode';
import {
  Taka, AdminPageHeader, AdminStatCard, AdminFilterBar, AdminFilterRow,
  AdminSearchInput, CustomSelect, AdminLoadingScreen, AdminEmptyState,
  OrderStatusBadge, PaymentMethodBadge, PaymentStatusBadge,
} from '@/app/admin/components/AdminUI';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString('en-BD');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
  { value: 'All', label: 'All Methods' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'bKash', label: 'bKash' },
  { value: 'SSLCommerz', label: 'SSL Commerz' },
];

const INDICATOR_COLOR = {
  Pending: 'bg-amber-400',
  Processing: 'bg-blue-500',
  Shipped: 'bg-violet-500',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-500',
};

// ─── fraud check modal ────────────────────────────────────────────────────────
const FraudCheckModal = ({ isOpen, onClose, customer }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      checkFraud(customer.phone)
        .then(r => { setData(r); setLoading(false); })
        .catch(() => setLoading(false));
    } else { setData(null); }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const ss = data?.sources?.steadfast;
  const sfStats = { total: (ss?.total_delivered ?? 0) + (ss?.total_cancelled ?? 0), delivered: ss?.total_delivered ?? 0, returned: ss?.total_cancelled ?? 0 };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-[#800000] text-white p-5 flex justify-between items-start relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 block mb-1">Risk Analysis</span>
            <h3 className="font-bodoni text-2xl">{customer?.firstName} {customer?.lastName}</h3>
            <p className="text-xs text-white/70 font-mono mt-0.5">{customer?.phone}</p>
          </div>
          <button onClick={onClose} className="bg-white/15 p-2 rounded-xl hover:bg-white/25 transition-colors relative z-10"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#faf9f6]">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="animate-spin text-[#800000]" size={28}/>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scanning databases…</p>
            </div>
          ) : data ? (
            <>
              {data.sources?.steadfast?.frauds?.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <div className="flex gap-2 items-center mb-2">
                    <ShieldAlert size={16} className="text-[#800000]"/>
                    <h4 className="font-black text-[#800000] text-xs uppercase tracking-wide">Fraud Record Found</h4>
                  </div>
                  {data.sources.steadfast.frauds.map((f, i) => (
                    <div key={i} className="text-xs bg-white p-3 rounded-lg border border-red-100 text-gray-700 leading-relaxed">{f.details || 'No details.'}</div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className={`text-4xl font-bodoni font-bold ${data.score < 50 ? 'text-[#800000]' : 'text-green-700'}`}>{data.score}%</div>
                <div className="flex-1 border-l border-gray-100 pl-4">
                  <h4 className="font-black text-sm uppercase text-gray-900 tracking-wide">{data.level} Risk</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{data.suggestion}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {[
                  { label: 'Internal', data: data.sources?.internal },
                  { label: 'Steadfast', data: sfStats },
                  { label: 'Pathao', data: data.sources?.pathao },
                ].map(({ label, data: d }) => d ? (
                  <div key={label} className="flex justify-between items-center text-xs p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <span className="font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#800000]"/>
                      {label}
                    </span>
                    <div className="flex gap-6">
                      {[['Total', d.total, 'text-gray-900'], ['Done', d.delivered, 'text-green-700'], ['Return', d.returned, 'text-[#800000]']].map(([lbl, val, cls]) => (
                        <div key={lbl} className="text-center">
                          <span className={`block font-bold text-base ${cls}`}>{val ?? 0}</span>
                          <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null)}
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-xs text-gray-400 uppercase tracking-widest">No analysis data.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── cancel modal ─────────────────────────────────────────────────────────────
const CANCEL_REASONS = ['Customer Request', 'Stock Issue', 'Duplicate Order', 'Fraud Suspected', 'Other'];
const CancelModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100"
      >
        <div className="flex items-start gap-3 mb-5">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5"/>
          <div>
            <h3 className="font-bodoni text-xl text-black">Cancel Order</h3>
            <p className="text-xs text-gray-500 mt-1">Select a reason for cancellation.</p>
          </div>
        </div>
        <div className="space-y-2">
          {CANCEL_REASONS.map(r => (
            <button key={r} onClick={() => onConfirm(r)}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-[#800000] rounded-xl text-xs font-black uppercase tracking-wide transition-all border border-transparent hover:border-red-100 flex justify-between items-center group"
            >
              {r} <ChevronDown size={13} className="opacity-0 group-hover:opacity-100 -rotate-90 transition-all"/>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2.5 text-xs text-gray-400 font-black uppercase tracking-widest hover:text-black transition-colors">
          Dismiss
        </button>
      </motion.div>
    </div>
  );
};

// ─── action button ────────────────────────────────────────────────────────────
const ACTION_STYLES = {
  blue:   'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
  purple: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200',
  green:  'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
};
function ActionBtn({ onClick, icon, label, color = 'blue', loading: ld }) {
  return (
    <button onClick={onClick} disabled={ld}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border disabled:opacity-50 ${ACTION_STYLES[color]}`}
    >
      {ld ? <Loader2 size={13} className="animate-spin"/> : icon} {label}
    </button>
  );
}

// ─── order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, expanded, onToggle, onStatusChange, onFraudCheck, onCancel, shippingId, onShip, onTrack }) {
  const pd = order.paymentDetails;
  const isPaid = order.paymentStatus === 'Paid';
  const shippingFee = order.shippingFee ?? (order.shippingAddress?.method === 'outside' ? 150 : 80);

  return (
    <motion.div layout key={order._id}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Summary row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 cursor-pointer relative select-none"
        onClick={onToggle}
      >
        {/* Status bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${INDICATOR_COLOR[order.status] ?? 'bg-gray-300'}`} />

        {/* ID + status */}
        <div className="flex items-center gap-3 sm:w-56 pl-3">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
            <Package size={16}/>
          </div>
          <div className="min-w-0">
            <p className="font-mono font-black text-sm text-black tracking-wide truncate">{order.orderId}</p>
            <div className="mt-0.5">
              <OrderStatusBadge status={order.status}/>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="flex-1 min-w-0 sm:pl-2">
          <p className="font-bold text-sm text-gray-900 truncate">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[10px] font-mono text-gray-400">{order.guestInfo?.phone}</span>
            <span className="text-[9px] text-gray-300">{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</span>
          </div>
        </div>

        {/* Amount + payment */}
        <div className="flex items-center gap-4 sm:gap-6 sm:text-right flex-wrap">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            <p className="font-bodoni font-bold text-lg text-[#800000]"><Taka size={14}/>{fmt(order.totalAmount)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <PaymentMethodBadge method={order.paymentMethod}/>
            <PaymentStatusBadge status={order.paymentStatus}/>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-300 shrink-0">
            <ChevronDown size={18}/>
          </motion.div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-[#faf9f6]/60 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT col */}
              <div className="space-y-4">

                {/* Delivery */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-[#800000]"/>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-700">Delivery</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Name</span>
                      <span className="font-bold text-gray-900">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Phone</span>
                      <span className="font-mono font-bold text-gray-900">{order.guestInfo?.phone}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-400 font-bold uppercase tracking-wide text-[9px] mb-1">Address</p>
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        {order.shippingAddress?.address}, {order.shippingAddress?.city}
                        {order.shippingAddress?.postalCode ? `, ${order.shippingAddress.postalCode}` : ''}
                      </p>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Zone</span>
                      <span className="font-bold text-gray-900 capitalize">{order.shippingAddress?.method ?? 'inside'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-[#800000]"/>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-700">Payment</h4>
                    </div>
                    <PaymentStatusBadge status={order.paymentStatus}/>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Method</span>
                      <PaymentMethodBadge method={order.paymentMethod}/>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Subtotal</span>
                      <span className="font-bold text-gray-900"><Taka size={10}/>{fmt(order.subTotal ?? order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Shipping</span>
                      <span className="font-bold text-gray-900"><Taka size={10}/>{fmt(shippingFee)}</span>
                    </div>
                    {(order.discountAmount ?? 0) > 0 && (
                      <div className="flex justify-between text-[#800000]">
                        <span className="font-bold uppercase tracking-wide text-[9px]">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                        <span className="font-bold">−<Taka size={10}/>{fmt(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 border-black pt-2 mt-1">
                      <span className="font-black text-gray-900 text-xs uppercase tracking-wide">Total</span>
                      <span className="font-bodoni font-bold text-base text-[#800000]"><Taka size={14}/>{fmt(order.totalAmount)}</span>
                    </div>
                    {isPaid ? (
                      <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-lg p-2 text-[9px] font-black uppercase tracking-wide text-green-700">
                        <span className="flex items-center gap-1"><CheckCircle2 size={10}/> Paid</span>
                        <span>৳0 due</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg p-2 text-[9px] font-black uppercase tracking-wide text-amber-700">
                        <span className="flex items-center gap-1"><Clock size={10}/> Due on delivery</span>
                        <span><Taka size={9}/>{fmt(order.totalAmount)}</span>
                      </div>
                    )}
                    {order.paymentTransactionId && (
                      <div className="pt-1 border-t border-gray-100">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><Hash size={9}/>TXN</p>
                        <p className="font-mono text-[10px] text-gray-700 break-all">{order.paymentTransactionId}</p>
                      </div>
                    )}
                    {pd?.gateway === 'bKash' && pd.customerMsisdn && (
                      <div className="flex justify-between pt-1 border-t border-gray-100">
                        <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px] flex items-center gap-1"><Phone size={9}/>bKash No.</span>
                        <span className="font-mono font-bold text-[#E2136E] text-[10px]">{pd.customerMsisdn}</span>
                      </div>
                    )}
                    {pd?.gateway === 'SSLCommerz' && pd.cardType && (
                      <div className="flex justify-between pt-1 border-t border-gray-100">
                        <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Card/Wallet</span>
                        <span className="font-bold text-blue-700 text-[10px]">{pd.cardType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT col (2/3) */}
              <div className="lg:col-span-2 space-y-4">

                {/* Items */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                    <ShoppingBag size={13} className="text-gray-400"/>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Items ({order.items.length})</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 sm:p-4 hover:bg-gray-50/70 transition-colors">
                        <div className="w-14 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover"/>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-black truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {item.size && item.size !== 'STD' && (
                                  <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase">
                                    {item.size}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500 font-bold">× {item.quantity}</span>
                                {item.sku && <span className="text-[9px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{item.sku}</span>}
                              </div>
                              {item.barcode && (
                                <div className="mt-1 mix-blend-multiply opacity-70">
                                  <Barcode value={item.barcode} width={0.9} height={14} fontSize={0} displayValue={false} margin={0}/>
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-bodoni font-bold text-sm text-black"><Taka size={11}/>{fmt(item.price * item.quantity)}</p>
                              {item.basePrice && item.basePrice !== item.price && (
                                <p className="text-[9px] text-gray-400 line-through"><Taka size={8}/>{fmt(item.basePrice)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action toolbar */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">

                  {order.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => onFraudCheck(order.guestInfo)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        <ShieldAlert size={13}/> Risk Check
                      </button>
                      <ActionBtn onClick={() => onStatusChange(order._id, 'Processing')} icon={<Package size={13}/>} label="Approve" color="blue"/>
                    </>
                  )}

                  {order.status === 'Processing' && (
                    <>
                      {!order.consignment_id ? (
                        <ActionBtn
                          onClick={() => onShip(order._id)}
                          loading={shippingId === order._id}
                          icon={<Send size={13}/>}
                          label="Send to Courier"
                          color="purple"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-mono font-bold">
                          <Truck size={13}/> {order.tracking_code}
                        </div>
                      )}
                      <ActionBtn onClick={() => onStatusChange(order._id, 'Shipped')} icon={<Truck size={13}/>} label="Mark Shipped" color="purple"/>
                    </>
                  )}

                  {order.status === 'Shipped' && (
                    <ActionBtn onClick={() => onStatusChange(order._id, 'Delivered')} icon={<Check size={13}/>} label="Mark Delivered" color="green"/>
                  )}

                  {/* Track button — always visible for shipped/delivered or orders with consignment */}
                  {(order.consignment_id || ['Shipped', 'Delivered'].includes(order.status)) && (
                    <button
                      onClick={() => onTrack(order)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#0a0a0a] text-white hover:bg-black border border-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Navigation size={12}/> Track
                    </button>
                  )}

                  {!['Cancelled', 'Delivered'].includes(order.status) && (
                    <button
                      onClick={() => onCancel(order._id)}
                      className="ml-auto flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[#800000] hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-100 transition-colors"
                    >
                      <X size={13}/> Cancel
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [expanded,      setExpanded]      = useState(null);
  const [shippingId,    setShippingId]    = useState(null);
  const [bulkShipping,  setBulkShipping]  = useState(false);
  const [cancelId,      setCancelId]      = useState(null);
  const [fraudCustomer, setFraudCustomer] = useState(null);
  const [trackOrder,    setTrackOrder]    = useState(null);

  const load = async () => {
    const data = await getAdminOrders();
    setOrders(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-refresh shipped orders every 90 seconds
  useEffect(() => {
    const hasShipped = orders.some(o => o.status === 'Shipped' && o.consignment_id);
    if (!hasShipped) return;
    const interval = setInterval(async () => {
      const shippedOrders = orders.filter(o => o.status === 'Shipped' && o.consignment_id);
      await Promise.allSettled(shippedOrders.map(o => syncOrderCourierStatus(o._id)));
      load();
    }, 90000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleShip = async (id) => {
    setShippingId(id);
    try {
      const res = await sendToSteadfast(id);
      res.success ? toast.success(`Shipped! ${res.tracking_code}`) : toast.error(res.error || 'Failed');
      load();
    } catch { toast.error('Network error'); }
    setShippingId(null);
  };

  const handleBulkShip = async () => {
    if (!confirm('Send ALL Processing orders to Steadfast?')) return;
    setBulkShipping(true);
    try {
      const res = await bulkShipToSteadfast();
      res.success ? toast.success(`Shipped ${res.count ?? ''} orders.`) : toast.error(res.error || 'Failed');
      load();
    } catch { toast.error('Network error'); }
    setBulkShipping(false);
  };

  const handleStatus = async (id, status, reason = null) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    await updateOrderStatus(id, status, reason);
    load();
  };

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'All' && o.paymentMethod !== paymentFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      o.orderId?.toLowerCase().includes(q) ||
      `${o.guestInfo?.firstName} ${o.guestInfo?.lastName}`.toLowerCase().includes(q) ||
      o.guestInfo?.phone?.includes(q)
    );
  }), [orders, search, statusFilter, paymentFilter]);

  // stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    revenue: orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (o.totalAmount ?? 0), 0),
  }), [orders]);

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 lg:pt-0">
      <AdminLoadingScreen label="Loading Orders…"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">
      <AnimatePresence>
        {cancelId && <CancelModal isOpen onClose={() => setCancelId(null)} onConfirm={(r) => { handleStatus(cancelId, 'Cancelled', r); setCancelId(null); }}/>}
        {fraudCustomer && <FraudCheckModal isOpen onClose={() => setFraudCustomer(null)} customer={fraudCustomer}/>}
        {trackOrder && (
          <DeliveryStatusModal
            order={trackOrder}
            onClose={() => setTrackOrder(null)}
            onRefreshFromServer={load}
          />
        )}
      </AnimatePresence>

      <AdminPageHeader eyebrow="Order Management" title="Orders" count={filtered.length} countLabel="orders">
        <button
          onClick={handleBulkShip}
          disabled={bulkShipping}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#800000] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-[#800000]/20 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
        >
          {bulkShipping ? <Loader2 size={13} className="animate-spin"/> : <Truck size={13}/>}
          Bulk Courier
        </button>
      </AdminPageHeader>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <AdminStatCard label="Total Orders" value={stats.total} icon={ShoppingBag} color="bg-gray-100 text-gray-600"/>
          <AdminStatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-100 text-amber-700" highlight={stats.pending > 0}/>
          <AdminStatCard label="Processing" value={stats.processing} icon={Package} color="bg-blue-100 text-blue-700"/>
          <AdminStatCard label="Delivered" value={stats.delivered} icon={Check} color="bg-green-100 text-green-700"/>
          <AdminStatCard
            label="Revenue" value={<span className="flex items-center"><Taka size={18}/>{fmt(stats.revenue)}</span>}
            icon={Banknote} color="bg-[#800000]/10 text-[#800000]"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Filters */}
        <AdminFilterBar>
          <AdminFilterRow>
            <AdminSearchInput value={search} onChange={setSearch} placeholder="Search ID, Name, Phone…" className="sm:col-span-2"/>
            <CustomSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All Statuses"/>
            <CustomSelect value={paymentFilter} onChange={setPaymentFilter} options={PAYMENT_OPTIONS} placeholder="All Methods"/>
          </AdminFilterRow>
        </AdminFilterBar>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <AdminEmptyState icon={Package} title="No orders found" subtitle="Try adjusting your filters"/>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } }, hidden: {} }}
            className="space-y-3"
          >
            {filtered.map(order => (
              <motion.div
                key={order._id}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <OrderCard
                  order={order}
                  expanded={expanded === order._id}
                  onToggle={() => setExpanded(expanded === order._id ? null : order._id)}
                  onStatusChange={handleStatus}
                  onFraudCheck={setFraudCustomer}
                  onCancel={setCancelId}
                  shippingId={shippingId}
                  onShip={handleShip}
                  onTrack={setTrackOrder}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
