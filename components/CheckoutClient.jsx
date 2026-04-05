'use client';

import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, saveAddress } from '@/app/actions';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Truck, CreditCard, CheckCircle, Loader2,
  AlertTriangle, Check, ShoppingBag, LogIn, X, Clock, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── taka symbol ─── */
const Tk = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    className={`inline-block align-middle flex-shrink-0 ${className}`}
    style={{ transform: 'translateY(-1px)' }}>
    <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
      fontSize="22" fontWeight="bold" fill="currentColor" style={{ fontFamily: 'serif' }}>৳</text>
  </svg>
);
const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

/* ═══════════════════════ overlays ═══════════════════════ */
const SuccessOverlay = ({ onGoToOrders }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
      className="w-[72px] h-[72px] rounded-full bg-[#B91C1C] flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(185,28,28,0.35)]">
      <Check size={34} strokeWidth={3} className="text-white" />
    </motion.div>
    <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
      className="font-heading font-black text-5xl sm:text-6xl uppercase tracking-tighter text-white mb-3">
      Order Confirmed
    </motion.h2>
    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.42 }}
      className="text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-8">
      Your order has been placed successfully
    </motion.p>
    <motion.button
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.56 }}
      onClick={onGoToOrders}
      className="h-12 px-8 bg-white text-black text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-neutral-100 transition-colors flex items-center gap-2 rounded-xl">
      <ShoppingBag size={14} /> View My Orders
    </motion.button>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
      className="text-neutral-700 text-[10px] uppercase tracking-widest mt-5">
      Auto-redirecting in 3s…
    </motion.p>
  </motion.div>
);

/* ═══════════════════════ gateway loading overlay ═══════════════════════ */
const GatewayOverlay = ({ gateway }) => {
  const isBkash = gateway === 'bKash';
  const bg      = isBkash ? '#E2136E' : '#003087';
  const label   = isBkash ? 'bKash' : 'SSL Commerz';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center text-center px-6"
      style={{ background: '#0a0a0a' }}
    >
      {/* pulsing gateway logo */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl"
        style={{ background: bg }}
      >
        {isBkash ? (
          <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14">
            <rect x="6" y="8" width="12" height="22" rx="2.5" fill="white" fillOpacity="0.25"/>
            <rect x="9" y="12" width="6" height="13" rx="0.5" fill="white" fillOpacity="0.4"/>
            <circle cx="12" cy="26.5" r="1.3" fill="white" fillOpacity="0.7"/>
            <text x="22" y="27" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial,sans-serif">bKash</text>
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14">
            <path d="M10 12l14-4 14 4v10c0 8-14 14-14 14S10 30 10 22V12z" fill="white" fillOpacity="0.2"/>
            <path d="M16 24l5 5 11-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </motion.div>

      {/* spinner ring */}
      <div className="relative w-12 h-12 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${bg} transparent transparent transparent` }}
        />
        <div className="absolute inset-1 rounded-full border-2 border-white/5" />
      </div>

      <motion.p
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-white font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight mb-2">
        Connecting to {label}
      </motion.p>
      <motion.p
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        className="text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.22em]">
        Please do not close this window
      </motion.p>

      {/* animated dots */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
        ))}
      </motion.div>
    </motion.div>
  );
};

const GuestSuccessOverlay = ({ guestEmail, guestPhone, onSkip }) => {
  const [count, setCount] = useState(10);
  useEffect(() => {
    if (count <= 0) { onSkip(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onSkip]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
      <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
        className="w-[72px] h-[72px] rounded-full bg-[#B91C1C] flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(185,28,28,0.35)]">
        <Check size={34} strokeWidth={3} className="text-white" />
      </motion.div>

      <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
        className="font-heading font-black text-5xl sm:text-6xl uppercase tracking-tighter text-white mb-2">
        Order Placed
      </motion.h2>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.38 }}
        className="text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-10">
        We've received your order
      </motion.p>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.48 }}
        className="w-full max-w-sm bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B91C1C] mb-2">
          Track Your Order
        </p>
        <p className="text-xs text-neutral-400 leading-relaxed mb-5">
          Log in anytime using the details below to view your order status and delivery updates.
        </p>
        <div className="space-y-3.5 border-t border-white/[0.07] pt-4">
          {guestPhone && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-medium text-neutral-600">Phone</span>
              <span className="text-sm font-semibold text-white font-mono">{guestPhone}</span>
            </div>
          )}
          {guestEmail && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-medium text-neutral-600">Email</span>
              <span className="text-sm font-semibold text-white font-mono">{guestEmail}</span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.56 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-8">
        <Link href="/login" className="flex-1 h-12 bg-white text-black rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2">
          <LogIn size={14} /> Log In
        </Link>
        <Link href="/" className="flex-1 h-12 border border-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
          <ShoppingBag size={14} /> Keep Shopping
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="flex items-center gap-3 text-neutral-600">
        <Clock size={12} />
        <span className="text-[10px] uppercase tracking-widest font-medium">Closing in {count}s</span>
        <span>·</span>
        <button onClick={onSkip} className="text-[10px] uppercase tracking-widest font-medium hover:text-neutral-400 transition-colors">
          Dismiss
        </button>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════ error toast ═══════════════════════ */
const ErrorToast = ({ error, onClose }) => (
  <motion.div initial={{ y: 96, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 96, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2.5rem)] max-w-md bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-red-100/80 p-4 flex items-start gap-3.5">
    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
      <AlertTriangle size={14} className="text-[#B91C1C]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-gray-900 mb-0.5">Couldn't place order</p>
      <p className="text-xs text-gray-500 leading-relaxed">{error}</p>
    </div>
    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors mt-0.5 flex-shrink-0">
      <X size={16} />
    </button>
  </motion.div>
);

/* ═══════════════════════ form field ═══════════════════════ */
const Field = ({ label, name, value, onChange, type = 'text', required = false, autoFilled = false }) => (
  <div>
    <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-gray-400 mb-1.5">
      {label}
      {required && <span className="text-[#B91C1C] ml-0.5">*</span>}
    </label>
    <input
      name={name} type={type} value={value} onChange={onChange} required={required}
      className={`w-full h-11 px-3.5 text-sm font-medium text-gray-900 rounded-xl border transition-all
        placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-700
        ${autoFilled ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
    />
  </div>
);

/* ═══════════════════════ section header ═══════════════════════ */
const SectionHead = ({ step, title }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="text-[10px] font-bold text-gray-300 tabular-nums tracking-wider w-5 text-right flex-shrink-0">
      {String(step).padStart(2, '0')}
    </span>
    <div className="h-px flex-1 bg-gray-100" />
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 flex-shrink-0">{title}</h2>
    <div className="h-px flex-1 bg-gray-100" />
  </div>
);

/* ═══════════════════════ checkbox ═══════════════════════ */
const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
        ${checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-400'}`}>
      {checked && <Check size={10} strokeWidth={3} className="text-white" />}
    </button>
    <span className="text-xs font-medium text-gray-500 leading-tight">{label}</span>
  </label>
);

/* ═══════════════════════ payment badges ═══════════════════════ */
const BkashBadge = () => (
  <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#E2136E' }}>
    <svg viewBox="0 0 64 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14">
      {/* phone icon */}
      <rect x="2" y="4" width="10" height="18" rx="2" fill="white" fillOpacity="0.25"/>
      <rect x="4" y="7" width="6" height="11" rx="0.5" fill="white" fillOpacity="0.35"/>
      <circle cx="7" cy="19.5" r="1" fill="white" fillOpacity="0.6"/>
      {/* bKash wordmark */}
      <text x="16" y="18" fill="white" fontSize="11" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="-0.3">bKash</text>
    </svg>
  </div>
);

const SSLBadge = () => (
  <div className="w-16 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 overflow-hidden px-1">
    <svg viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* shield icon */}
      <path d="M5 6l4-2 4 2v6c0 3-4 6-4 6s-4-3-4-6V6z" fill="#0066B3"/>
      <path d="M7.5 11l1.5 1.5L12 9" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* SSL text */}
      <text x="16" y="12" fill="#0066B3" fontSize="7.5" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="0.3">SSL</text>
      <text x="16" y="22" fill="#444" fontSize="6.5" fontWeight="600" fontFamily="Arial,sans-serif" letterSpacing="0.2">COMMERZ</text>
    </svg>
  </div>
);

const CODBadge = () => (
  <div className="w-16 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200 overflow-hidden gap-1.5 px-2">
    <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide leading-tight">Cash<br/>on Del.</span>
  </div>
);

/* ═══════════════════════════ main ═══════════════════════════ */
export default function CheckoutClient({ savedAddresses = [], sessionUser = null, shopSettings = null }) {
  const { cart, appliedCoupon, clearCart } = useCart();
  const router = useRouter();

  const delivery  = shopSettings?.deliveryPricing ?? { insideDhaka: 80, outsideDhaka: 150, freeDelivery: false };
  const pmCfg     = shopSettings?.paymentMethods   ?? { cashOnDelivery: true, bkash: false, sslcommerz: false };

  /* ── ui state ── */
  const [loading,          setLoading]          = useState(false);
  const [isSuccess,        setIsSuccess]        = useState(false);
  const [isGuestSuccess,   setIsGuestSuccess]   = useState(false);
  const [guestDone,        setGuestDone]        = useState({ email: null, phone: null });
  const [errorMsg,         setErrorMsg]         = useState(null);
  const [isRedirecting,    setIsRedirecting]    = useState(false);
  const [redirectGateway,  setRedirectGateway]  = useState(null);

  /* ── address mode ── */
  // default to saved-address tab only when the user has saved addresses
  const [useSaved,       setUseSaved]       = useState(savedAddresses.length > 0);
  const [selectedAddrId, setSelectedAddrId] = useState(savedAddresses[0]?._id || null);
  const [saveForLater,   setSaveForLater]   = useState(false);

  /* ── shipping + payment ── */
  const [shippingMethod, setShippingMethod] = useState('inside');

  const enabledPM = [
    pmCfg.cashOnDelivery && { id: 'COD',       label: 'Cash on Delivery', sub: 'Pay when your order arrives', badge: <CODBadge /> },
    pmCfg.bkash          && { id: 'bKash',     label: 'bKash',            sub: 'Mobile financial service',   badge: <BkashBadge /> },
    pmCfg.sslcommerz     && { id: 'SSLCommerz',label: 'SSL Commerz',      sub: 'Card / bank transfer',       badge: <SSLBadge /> },
  ].filter(Boolean);
  const [paymentMethod, setPaymentMethod] = useState(enabledPM[0]?.id || 'COD');

  /* ── form fields ── */
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '', label: 'Home',
  });

  // Track which contact fields were auto-filled so we can highlight them
  const [autoFilledFields, setAutoFilledFields] = useState([]);

  /* ── auto-fill from session (contact info always, address from first saved if switching to new) ── */
  useEffect(() => {
    if (!sessionUser) return;
    if (useSaved) return; // using saved-address picker — don't overwrite

    const filled = [];
    setForm(prev => {
      const next = { ...prev };
      if (sessionUser.firstName && !prev.firstName) { next.firstName = sessionUser.firstName; filled.push('firstName'); }
      if (sessionUser.lastName  && !prev.lastName)  { next.lastName  = sessionUser.lastName;  filled.push('lastName'); }
      if (sessionUser.email     && !prev.email)     { next.email     = sessionUser.email;     filled.push('email'); }
      if (sessionUser.phone     && !prev.phone)     { next.phone     = sessionUser.phone;     filled.push('phone'); }
      // also pre-fill address from first saved address if user has one
      if (savedAddresses.length > 0 && !prev.address) {
        const a = savedAddresses[0];
        next.address  = a.address  || prev.address;
        next.city     = a.city     || prev.city;
        if (next.address !== prev.address) filled.push('address');
        if (next.city    !== prev.city)    filled.push('city');
      }
      return next;
    });
    if (filled.length > 0) setAutoFilledFields(filled);
  }, [sessionUser, useSaved, savedAddresses]);

  /* ── totals ── */
  const shippingCost = delivery.freeDelivery ? 0
    : shippingMethod === 'inside' ? delivery.insideDhaka : delivery.outsideDhaka;
  const subTotal = cart.reduce((t, item) => {
    const p = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
    return t + p * item.quantity;
  }, 0);
  const discount = appliedCoupon?.amount || 0;
  const total    = Math.max(0, subTotal + shippingCost - discount);

  useEffect(() => {
    if (cart.length === 0 && !isSuccess && !isGuestSuccess) router.push('/cart');
  }, [cart, router, isSuccess, isGuestSuccess]);

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.push('/account/orders'), 3000);
      return () => clearTimeout(t);
    }
  }, [isSuccess, router]);

  const handleField      = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSkip       = useCallback(() => { setIsGuestSuccess(false); router.push('/'); }, [router]);
  const handleGoToOrders = useCallback(() => router.push('/account/orders'), [router]);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let data = {};
    if (useSaved && selectedAddrId) {
      data = { ...savedAddresses.find(a => a._id === selectedAddrId) };
    } else {
      data = { ...form };
    }

    const res = await createOrder({
      guestInfo: {
        firstName: data.firstName      || '',
        lastName:  data.lastName       || '',
        email:     data.email          || '',
        phone:     data.phone          || '',
        address:   data.address        || '',
        city:      data.city           || '',
        postalCode: data.postalCode    || '',
      },
      items: cart.map(item => {
        const p = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
        return {
          product: item._id, name: item.name, price: p,
          quantity: item.quantity, size: item.selectedSize || item.size || 'STD',
          image: item.images?.[0] || item.image || '/placeholder.jpg',
        };
      }),
      shippingAddress: {
        address: data.address || '', city: data.city || '',
        postalCode: data.postalCode || '', method: shippingMethod,
      },
      couponCode:    appliedCoupon?.code || null,
      totalAmount:   total,
      paymentMethod,
      saveAddress:   !useSaved && saveForLater,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    clearCart();

    // ── Online payment: show gateway overlay then redirect ──
    if (paymentMethod === 'bKash') {
      setRedirectGateway('bKash');
      setIsRedirecting(true);
      try {
        const bkashRes = await fetch('/api/payment/bkash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            orderId: res.orderId,
            callbackURL: `${window.location.origin}/api/payment/bkash/callback`,
          }),
        });
        const bkashData = await bkashRes.json();
        if (bkashData.bkashURL) {
          window.location.href = bkashData.bkashURL;
          return;
        }
        setIsRedirecting(false);
        setErrorMsg(bkashData.error || 'bKash payment initiation failed. Please try again.');
        setLoading(false);
        return;
      } catch {
        setIsRedirecting(false);
        setErrorMsg('bKash payment initiation failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (paymentMethod === 'SSLCommerz') {
      setRedirectGateway('SSLCommerz');
      setIsRedirecting(true);
      try {
        const sslRes = await fetch('/api/payment/sslcommerz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            orderId: res.orderId,
            customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            customerEmail: data.email || '',
            customerPhone: data.phone || '',
            customerAddress: data.address || '',
          }),
        });
        const sslData = await sslRes.json();
        if (sslData.redirectURL) {
          window.location.href = sslData.redirectURL;
          return;
        }
        setIsRedirecting(false);
        setErrorMsg(sslData.error || 'SSL Commerz payment initiation failed. Please try again.');
        setLoading(false);
        return;
      } catch {
        setIsRedirecting(false);
        setErrorMsg('SSL Commerz payment initiation failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    // ── COD: show confirmation overlay ──
    if (res.isGuest) {
      setGuestDone({ email: res.guestEmail, phone: res.guestPhone });
      setIsGuestSuccess(true);
    } else {
      setIsSuccess(true);
    }
  };

  if (cart.length === 0 && !isSuccess && !isGuestSuccess) return null;

  /* ── selected saved address data (for display) ── */
  const selectedAddr = savedAddresses.find(a => a._id === selectedAddrId);

  return (
    <div className="min-h-screen bg-[#f7f6f4]">

      <AnimatePresence>{isRedirecting  && <GatewayOverlay gateway={redirectGateway} />}</AnimatePresence>
      <AnimatePresence>{isSuccess      && <SuccessOverlay onGoToOrders={handleGoToOrders} />}</AnimatePresence>
      <AnimatePresence>{isGuestSuccess && <GuestSuccessOverlay guestEmail={guestDone.email} guestPhone={guestDone.phone} onSkip={handleSkip} />}</AnimatePresence>
      <AnimatePresence>{errorMsg       && <ErrorToast error={errorMsg} onClose={() => setErrorMsg(null)} />}</AnimatePresence>

      {/* ──────────── NAV BAR ──────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/cart"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          <span className="font-heading font-black text-sm uppercase tracking-[0.22em] text-gray-900">
            Checkout
          </span>

          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 leading-none mb-0.5 font-medium">Total</p>
            <p className="text-sm font-bold text-gray-900 flex items-center justify-end gap-0.5">
              <Tk size={12} />{fmt(total)}
            </p>
          </div>
        </div>
      </header>

      {/* ──────────── BODY ──────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ══════════════ LEFT — FORM PANELS ══════════════ */}
          <div className="flex-1 w-full space-y-3.5">

            {/* ── 01 CONTACT INFORMATION ── */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7">
              <SectionHead step={1} title="Contact Information" />

              {/* Saved / New tabs — only if user has saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="flex gap-px mb-6 bg-gray-100 rounded-xl p-1">
                  {[
                    { label: 'Saved Address', val: true  },
                    { label: 'New Address',   val: false },
                  ].map(tab => (
                    <button key={tab.label} type="button" onClick={() => setUseSaved(tab.val)}
                      className={`flex-1 h-8 rounded-lg text-[11px] font-semibold uppercase tracking-[0.1em] transition-all
                        ${useSaved === tab.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">

                {/* SAVED ADDRESS PICKER */}
                {useSaved && savedAddresses.length > 0 ? (
                  <motion.div key="saved" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }} className="space-y-2.5">
                    {savedAddresses.map(addr => {
                      const active = addr._id === selectedAddrId;
                      return (
                        <button type="button" key={addr._id} onClick={() => setSelectedAddrId(addr._id)}
                          className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all
                            ${active ? 'border-gray-900 bg-gray-900/[0.015]' : 'border-gray-100 hover:border-gray-300'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {addr.label || 'Home'}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mb-0.5">{addr.firstName} {addr.lastName}</p>
                              <p className="text-xs text-gray-500 truncate">{addr.address}, {addr.city}</p>
                              <p className="text-xs text-gray-400 mt-1 font-mono">{addr.phone}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                              ${active ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                              {active && <Check size={10} strokeWidth={3} className="text-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>

                ) : (
                  /* NEW ADDRESS FORM */
                  <motion.div key="new" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }} className="space-y-4">

                    {/* auto-fill notice */}
                    {sessionUser && autoFilledFields.length > 0 && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200/80 rounded-xl">
                        <span className="text-amber-500 flex-shrink-0">
                          <CheckCircle size={13} />
                        </span>
                        <p className="text-[11px] text-amber-700 font-medium">
                          Pre-filled from your account details
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="First Name" name="firstName" value={form.firstName} onChange={handleField}
                        required autoFilled={autoFilledFields.includes('firstName')} />
                      <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleField}
                        autoFilled={autoFilledFields.includes('lastName')} />
                    </div>

                    <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleField}
                      required autoFilled={autoFilledFields.includes('phone')} />

                    <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleField}
                      autoFilled={autoFilledFields.includes('email')} />

                    {/* Save for later — shown to all users */}
                    <div className="pt-1">
                      <Checkbox
                        checked={saveForLater}
                        onChange={setSaveForLater}
                        label="Save this address for future orders"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── 02 DELIVERY ADDRESS ── */}
            {/* Hide when using saved address — it's already in the selected card */}
            {!(useSaved && selectedAddr) && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7">
                <SectionHead step={2} title="Delivery Address" />
                <div className="space-y-4">
                  <Field label="Full Address" name="address" value={form.address} onChange={handleField}
                    required autoFilled={autoFilledFields.includes('address')} />
                  <Field label="District" name="city" value={form.city} onChange={handleField}
                    required autoFilled={autoFilledFields.includes('city')} />
                </div>
              </div>
            )}

            {/* ── 03 DELIVERY METHOD ── */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7">
              <SectionHead step={useSaved && selectedAddr ? 2 : 3} title="Delivery Method" />

              {delivery.freeDelivery ? (
                <div className="flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/60">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Truck size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Free Delivery</p>
                    <p className="text-xs text-gray-400 mt-0.5">Complimentary shipping on all orders</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">FREE</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { id: 'inside',  label: 'Inside Dhaka',  price: delivery.insideDhaka,  eta: '1–2 business days' },
                    { id: 'outside', label: 'Outside Dhaka', price: delivery.outsideDhaka, eta: '3–5 business days' },
                  ].map(opt => {
                    const active = shippingMethod === opt.id;
                    return (
                      <button type="button" key={opt.id} onClick={() => setShippingMethod(opt.id)}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all
                          ${active ? 'border-gray-900 bg-gray-900/[0.015]' : 'border-gray-100 hover:border-gray-300'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                          ${active ? 'bg-gray-900' : 'bg-gray-100'}`}>
                          <Truck size={15} className={active ? 'text-white' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.eta}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-0.5">
                            <Tk size={12} />{fmt(opt.price)}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${active ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                          {active && <Check size={10} strokeWidth={3} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 04 PAYMENT METHOD (only when >1 option) ── */}
            {enabledPM.length > 1 && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7">
                <SectionHead step={useSaved && selectedAddr ? 3 : 4} title="Payment Method" />
                <div className="space-y-2.5">
                  {enabledPM.map(m => {
                    const active = paymentMethod === m.id;
                    return (
                      <button type="button" key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all
                          ${active ? 'border-gray-900 bg-gray-900/[0.015]' : 'border-gray-100 hover:border-gray-300'}`}>
                        {m.badge}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${active ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                          {active && <Check size={10} strokeWidth={3} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ══════════════ RIGHT — ORDER SUMMARY ══════════════ */}
          <div className="w-full lg:w-[340px] xl:w-[360px] flex-shrink-0 lg:sticky lg:top-20">

            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">

              {/* header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-0.5">Order Summary</p>
                <p className="text-xs font-medium text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              </div>

              {/* items */}
              <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {cart.map(item => {
                  const price = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
                  return (
                    <div key={`${item._id}-${item.selectedSize}`} className="flex items-center gap-3.5 px-6 py-3.5">
                      <div className="relative w-11 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={item.images?.[0] || item.image || '/placeholder.jpg'}
                          alt={item.name} fill sizes="44px" className="object-cover" />
                        <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 leading-tight truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{item.selectedSize || 'Standard'}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-gray-900 flex-shrink-0 flex items-center gap-0.5">
                        <Tk size={11} />{fmt(price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* totals */}
              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 flex items-center gap-0.5"><Tk size={12} />{fmt(subTotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-semibold text-[#B91C1C] flex items-center gap-0.5">−<Tk size={12} className="text-[#B91C1C]" />{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  <span className={`font-medium flex items-center gap-0.5 ${delivery.freeDelivery ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {delivery.freeDelivery ? 'Free' : <><Tk size={12} />{fmt(shippingCost)}</>}
                  </span>
                </div>

                <div className="h-px bg-gray-100 my-1" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900 flex items-center gap-0.5">
                    <Tk size={16} />{fmt(total)}
                  </span>
                </div>
              </div>

              {/* payment badge — only when one method */}
              {enabledPM.length <= 1 && (
                <div className="mx-6 mb-4 flex items-center gap-3 px-3.5 py-3 bg-gray-50 rounded-xl">
                  <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{enabledPM[0]?.label || 'Cash on Delivery'}</p>
                    <p className="text-[10px] text-gray-400">Pay when your order arrives</p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="px-6 pb-6">
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-gray-900 text-white rounded-xl text-[12px] font-bold uppercase tracking-[0.18em]
                    hover:bg-black active:scale-[0.99] transition-all flex items-center justify-center gap-2
                    disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>Place Order</span><ChevronRight size={15} /></>
                  }
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
                  By placing your order you agree to our terms &amp; conditions
                </p>
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
