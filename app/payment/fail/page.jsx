'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ShoppingBag, RefreshCw, Phone, Mail } from 'lucide-react';

const REASON_LABELS = {
  cancel:            { title: 'Payment Cancelled',       detail: 'You cancelled the payment. No charge was made.' },
  failure:           { title: 'Payment Failed',          detail: 'Your payment could not be processed at the gateway.' },
  missing_id:        { title: 'Payment ID Missing',      detail: 'We did not receive a payment reference from the gateway.' },
  execution_failed:  { title: 'Execution Failed',        detail: 'The payment could not be executed. Please try again.' },
  validation_failed: { title: 'Validation Failed',       detail: 'We could not verify your payment. Contact support if charged.' },
  server_error:      { title: 'Server Error',            detail: 'An internal error occurred. No order was placed — please try again.' },
  missing_params:    { title: 'Missing Parameters',      detail: 'Required payment data was missing. Please try again.' },
  fail:              { title: 'Payment Unsuccessful',    detail: 'The transaction was declined. No charge was made.' },
  order_error:       { title: 'Order Creation Failed',   detail: 'Payment was received but the order could not be placed. Contact support immediately.' },
};

const GATEWAY_COLORS = {
  bkash:     { primary: '#E2136E', light: '#fdf0f6', label: 'bKash' },
  sslcommerz: { primary: '#0066B3', light: '#f0f6fd', label: 'SSL Commerz' },
};

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const reason  = searchParams.get('reason')  || 'fail';
  const gateway = searchParams.get('gateway') || '';
  const [show, setShow] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShow(true), 50); return () => clearTimeout(t); }, []);

  const info    = REASON_LABELS[reason] ?? { title: 'Payment Error', detail: 'An unexpected error occurred.' };
  const gw      = GATEWAY_COLORS[gateway] ?? { primary: '#B91C1C', light: '#fff0f0', label: 'Payment' };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-16 overflow-hidden relative">

      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: gw.primary }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width: `${8 + i * 4}px`,
            height: `${8 + i * 4}px`,
            background: gw.primary,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{ y: [-12, 12, -12], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md relative z-10"
          >

            {/* Icon */}
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
                className="relative"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: `${gw.primary}20`, border: `1.5px solid ${gw.primary}30` }}
                >
                  <AlertTriangle size={36} style={{ color: gw.primary }} strokeWidth={1.5} />
                </div>
                {/* pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: `2px solid ${gw.primary}` }}
                  animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
              </motion.div>
            </div>

            {/* Gateway label */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center text-[10px] font-bold uppercase tracking-[0.3em] mb-2"
              style={{ color: gw.primary }}
            >
              {gw.label}
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="text-center font-heading font-black text-4xl sm:text-5xl uppercase tracking-tighter text-white mb-3"
            >
              {info.title}
            </motion.h1>

            {/* Detail */}
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="text-center text-neutral-500 text-sm leading-relaxed mb-8"
            >
              {info.detail}
            </motion.p>

            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-white/4 border border-white/[0.07] rounded-2xl p-5 mb-6 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw size={12} className="text-neutral-400" />
                </div>
                <p className="text-[12px] text-neutral-400 leading-relaxed">
                  No order was placed. Your cart and details are saved — go back to try again.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={12} className="text-neutral-400" />
                </div>
                <p className="text-[12px] text-neutral-400 leading-relaxed">
                  If you were charged but don't see a confirmation, contact our support team immediately.
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="grid grid-cols-2 gap-3 mb-4"
            >
              <Link
                href="/checkout"
                className="h-12 bg-white text-black text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 rounded-xl"
              >
                <ArrowLeft size={13} /> Try Again
              </Link>
              <Link
                href="/"
                className="h-12 border border-white/15 text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-white/5 hover:border-white/25 transition-colors flex items-center justify-center gap-2 rounded-xl"
              >
                <ShoppingBag size={13} /> Keep Shopping
              </Link>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.78 }}
              className="border-t border-white/6 pt-5"
            >
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 mb-3">
                Need Help?
              </p>
              <div className="flex justify-center gap-5">
                <a
                  href="mailto:info@oura-lifestyle.com"
                  className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-white transition-colors"
                >
                  <Mail size={12} /> Email Support
                </a>
                <span className="text-neutral-800">·</span>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-white transition-colors"
                >
                  <ShoppingBag size={12} /> View Orders
                </Link>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailContent />
    </Suspense>
  );
}
