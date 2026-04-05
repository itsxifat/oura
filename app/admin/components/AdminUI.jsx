'use client';

/**
 * OURA Admin Design System
 * ─────────────────────────
 * Shared components used by every admin page to guarantee a consistent,
 * mobile-first, premium UI.  Import what you need from this file.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronLeft, ChevronRight, Search, Check, X,
  Loader2, AlertCircle, Calendar,
} from 'lucide-react';

// ─── TAKA (৳) ────────────────────────────────────────────────────────────────
export const Taka = ({ size = 14, className = '' }) => (
  <svg
    width={size} height={size + 2}
    viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block align-middle ${className}`}
    style={{ transform: 'translateY(-1px)' }}
  >
    <text x="50%" y="57%" dominantBaseline="middle" textAnchor="middle"
      fontSize="20" fontWeight="bold" fill="currentColor"
      style={{ fontFamily: 'var(--font-heading)' }}>৳</text>
  </svg>
);

// ─── ADMIN PAGE HEADER ────────────────────────────────────────────────────────
export function AdminPageHeader({ eyebrow, title, count, countLabel = 'records', children }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#800000] block mb-0.5">
              {eyebrow}
            </span>
          )}
          <h1 className="font-bodoni text-2xl sm:text-3xl font-bold text-black truncate">{title}</h1>
          {count !== undefined && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {count} {countLabel}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN STAT CARD ──────────────────────────────────────────────────────────
export function AdminStatCard({ label, value, sub, icon: Icon, color = 'bg-gray-100 text-gray-600', loading, highlight }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 flex items-start gap-3 sm:gap-4 overflow-hidden relative
        ${highlight ? 'border-[#800000]/30' : 'border-gray-200'}`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#800000]/5 to-transparent pointer-events-none" />
      )}
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="relative z-10 min-w-0">
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-xl sm:text-2xl font-bodoni text-gray-900 leading-none truncate">{value}</p>
        )}
        {sub && <p className="text-[10px] text-gray-400 mt-1 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── ADMIN FILTER BAR WRAPPER ─────────────────────────────────────────────────
export function AdminFilterBar({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

// ─── ADMIN FILTER ROW ─────────────────────────────────────────────────────────
export function AdminFilterRow({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {children}
    </div>
  );
}

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export function AdminSearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative group ${className}`}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#800000] transition-colors pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-gray-200 rounded-xl bg-gray-50 placeholder:text-gray-300 focus:outline-none focus:border-[#800000]/40 focus:bg-white transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ─── CUSTOM SELECT ────────────────────────────────────────────────────────────
export function CustomSelect({ value, onChange, options, placeholder = 'Select…', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold border rounded-xl transition-all
          ${open
            ? 'border-[#800000]/40 bg-white shadow-sm'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
          }`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
          >
            <div className="max-h-52 overflow-y-auto custom-scrollbar py-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-left transition-colors
                    ${value === opt.value
                      ? 'bg-[#800000]/10 text-[#800000]'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {opt.label}
                  {value === opt.value && <Check size={12} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CUSTOM DATE PICKER ────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarDropdown({ value, onChange, onClear, label }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDay = value ? (() => {
    const d = new Date(value);
    return d.getFullYear() === view.year && d.getMonth() === view.month ? d.getDate() : null;
  })() : null;

  const today = new Date();
  const todayDay = today.getFullYear() === view.year && today.getMonth() === view.month ? today.getDate() : null;

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const selectDay = (d) => {
    if (!d) return;
    const date = new Date(view.year, view.month, d);
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onChange(iso);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : null;

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold border rounded-xl transition-all
          ${open ? 'border-[#800000]/40 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
      >
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gray-400 flex-shrink-0" />
          <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>{displayValue || label}</span>
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} className="text-gray-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl p-3 w-[240px]"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                {MONTHS[view.month]} {view.year}
              </span>
              <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[9px] font-black uppercase tracking-wide text-gray-300 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  disabled={!d}
                  className={`h-8 w-full rounded-lg text-[11px] font-bold transition-all
                    ${!d ? '' : d === selectedDay
                      ? 'bg-[#800000] text-white shadow-md shadow-[#800000]/20'
                      : d === todayDay
                        ? 'bg-[#800000]/10 text-[#800000] hover:bg-[#800000]/20'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {d || ''}
                </button>
              ))}
            </div>

            {/* Today shortcut */}
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                const iso = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
                onChange(iso);
                setOpen(false);
              }}
              className="mt-3 w-full text-[10px] font-black uppercase tracking-widest text-[#800000] hover:bg-[#800000]/5 py-1.5 rounded-lg transition-colors"
            >
              Today
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CustomDateRange({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex gap-2 items-center">
      <CalendarDropdown value={from} onChange={onFromChange} onClear={() => onFromChange('')} label="From date" />
      <span className="text-gray-300 font-bold text-xs flex-shrink-0">–</span>
      <CalendarDropdown value={to} onChange={onToChange} onClear={() => onToChange('')} label="To date" />
    </div>
  );
}

export function CustomDatePicker({ value, onChange, label = 'Pick date', className = '' }) {
  return (
    <div className={className}>
      <CalendarDropdown value={value} onChange={onChange} onClear={() => onChange('')} label={label} />
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
export function AdminLoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 size={36} className="text-[#800000]" />
      </motion.div>
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">{label}</span>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function AdminEmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 sm:py-28 text-center flex flex-col items-center"
    >
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
        {Icon && <Icon size={24} className="text-gray-300" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-300 mb-4">{subtitle}</p>}
      {action}
    </motion.div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const ORDER_STATUS_STYLES = {
  Pending:    'bg-amber-50 text-amber-700 border-amber-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped:    'bg-violet-50 text-violet-700 border-violet-200',
  Delivered:  'bg-green-50 text-green-700 border-green-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ORDER_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

// ─── PAYMENT METHOD BADGE ─────────────────────────────────────────────────────
export function PaymentMethodBadge({ method }) {
  if (method === 'bKash') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-pink-50 text-[#E2136E] border border-pink-200">
      <span className="w-2 h-2 rounded-full bg-[#E2136E] inline-block" />bKash
    </span>
  );
  if (method === 'SSLCommerz') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />SSL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-gray-100 text-gray-600 border border-gray-200">
      COD
    </span>
  );
}

// ─── PAYMENT STATUS BADGE ─────────────────────────────────────────────────────
export function PaymentStatusBadge({ status }) {
  const isPaid = status === 'Paid';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border
      ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
      {isPaid ? <Check size={9}/> : null}{isPaid ? 'Paid' : 'Pending'}
    </span>
  );
}

// ─── SORTABLE TABLE HEADER ────────────────────────────────────────────────────
export function SortTh({ field, sortField, sortDir, onSort, children, className = '' }) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors
        ${active ? 'text-[#800000]' : 'text-gray-400 hover:text-gray-700'} ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        <motion.span
          animate={{ rotate: active && sortDir === 'asc' ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`inline-block ${active ? 'opacity-100' : 'opacity-20'}`}
        >
          <ChevronDown size={11} />
        </motion.span>
      </span>
    </th>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className={`p-5 border-b border-gray-100 flex items-start gap-3 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
          <AlertCircle size={20} className={danger ? 'text-red-500 flex-shrink-0 mt-0.5' : 'text-gray-400 flex-shrink-0 mt-0.5'} />
          <div>
            <h3 className="font-bold text-sm text-gray-900">{title}</h3>
            {message && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="p-4 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50 flex items-center gap-2
              ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#800000] hover:bg-[#6b0000]'}`}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ADMIN CARD ───────────────────────────────────────────────────────────────
export function AdminCard({ children, className = '', noPad = false }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${noPad ? '' : 'p-5 sm:p-6'} ${className}`}>
      {children}
    </div>
  );
}

// ─── ADMIN SECTION TITLE ──────────────────────────────────────────────────────
export function AdminSectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bodoni text-lg sm:text-xl text-black">{children}</h2>
      {action}
    </div>
  );
}

// ─── TAG/CHIP ─────────────────────────────────────────────────────────────────
export function Chip({ label, color, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border"
      style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <X size={10} />
        </button>
      )}
    </span>
  );
}

// ─── INLINE TOAST ─────────────────────────────────────────────────────────────
export function AdminToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold min-w-[260px] max-w-[90vw]
        ${type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}
    >
      {type === 'success' ? <Check size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </motion.div>
  );
}
