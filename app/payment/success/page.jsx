'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, ArrowRight, Clock } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const gateway = searchParams.get('gateway');
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const gatewayLabel = gateway === 'bkash' ? 'bKash' : gateway === 'sslcommerz' ? 'SSL Commerz' : 'Online';

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
        className="w-[72px] h-[72px] rounded-full bg-[#B91C1C] flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(185,28,28,0.35)]"
      >
        <Check size={34} strokeWidth={3} className="text-white" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
        className="font-heading font-black text-5xl sm:text-6xl uppercase tracking-tighter text-white mb-2"
      >
        Payment Successful
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.38 }}
        className="text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.25em] mb-10"
      >
        {gatewayLabel} payment confirmed
      </motion.p>

      {orderId && (
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.48 }}
          className="w-full max-w-sm bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B91C1C] mb-3">Order Details</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-medium text-neutral-600">Order ID</span>
            <span className="text-sm font-semibold text-white font-mono">{orderId}</span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.56 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-8"
      >
        <Link
          href="/account/orders"
          className="flex-1 h-12 bg-white text-black rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
        >
          View Orders <ArrowRight size={14} />
        </Link>
        <Link
          href="/"
          className="flex-1 h-12 border border-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag size={14} /> Keep Shopping
        </Link>
      </motion.div>

      {count > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex items-center gap-3 text-neutral-600"
        >
          <Clock size={12} />
          <span className="text-[10px] uppercase tracking-widest font-medium">Auto-closing in {count}s</span>
        </motion.div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
