"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ArrowRight, Clock, TrendingUp, Tag,
  ChevronRight, Loader2, Pin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts, logSearch, getTrendingSearches } from "@/actions/search";
import { trackSearch } from "@/lib/gtm";

// ─── local recent searches (localStorage) ────────────────────────────────────
const RECENT_KEY = "oura_recent_searches";
const MAX_RECENT = 6;

function getRecent() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}
function saveRecent(q) {
  if (!q.trim()) return;
  const prev = getRecent().filter(s => s.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(q) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(s => s !== q)));
}

// ─── highlight matching text ──────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-[#B91C1C]/10 text-[#B91C1C] font-semibold rounded-sm px-0.5 not-italic">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ─── single product row ───────────────────────────────────────────────────────
function ProductResult({ product, query, isActive, onClick }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-3 transition-all duration-150 group ${
        isActive ? "bg-[#B91C1C]/5" : "hover:bg-gray-50/80"
      }`}
    >
      {/* thumbnail */}
      <div className="w-11 h-13 shrink-0 bg-gray-100 overflow-hidden rounded-lg border border-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Tag size={14} />
          </div>
        )}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate leading-snug">
          <Highlight text={product.name} query={query} />
        </p>
        {product.category && (
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
            {product.category.name}
          </p>
        )}
        {product.tags?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {product.tags.slice(0, 3).map(t => (
              <span
                key={t.name}
                className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                style={{ backgroundColor: t.color + "22", color: t.color }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* price */}
      <div className="shrink-0 text-right">
        {product.discountPrice ? (
          <>
            <p className="text-[13px] font-bold text-[#B91C1C]">৳{product.discountPrice}</p>
            <p className="text-[10px] text-gray-400 line-through">৳{product.price}</p>
          </>
        ) : (
          <p className="text-[13px] font-bold text-gray-900">৳{product.price}</p>
        )}
      </div>

      <ChevronRight
        size={13}
        className={`shrink-0 transition-all duration-200 ${
          isActive ? "text-[#B91C1C] translate-x-0.5" : "text-gray-200 group-hover:text-gray-400"
        }`}
      />
    </Link>
  );
}

// ─── chip button ──────────────────────────────────────────────────────────────
function Chip({ label, icon: Icon, iconColor, onClick, onRemove, active }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-all duration-150 group/chip cursor-pointer select-none ${
        active
          ? "bg-[#B91C1C] border-[#B91C1C] text-white"
          : "bg-white border-gray-200 text-gray-700 hover:border-[#B91C1C] hover:text-[#B91C1C]"
      }`}
      onClick={onClick}
    >
      {Icon && <Icon size={10} className={active ? "text-white" : iconColor} />}
      <span className="text-[11px] font-semibold">{label}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover/chip:opacity-100 transition ml-0.5 text-gray-300 hover:text-red-400"
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function SearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState([]);
  const [trending, setTrending] = useState({ pinned: [], trending: [] });
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  // on open: reset state, focus, fetch trending
  useEffect(() => {
    if (isOpen) {
      setRecent(getRecent());
      setQuery("");
      setResults({ products: [], categories: [] });
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);

      if (!trendingLoaded) {
        getTrendingSearches().then(data => {
          setTrending(data);
          setTrendingLoaded(true);
        });
      }
    }
  }, [isOpen]);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  // fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchProducts(debouncedQuery).then(res => {
      if (!cancelled) { setResults(res); setLoading(false); setActiveIndex(-1); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const totalItems = results.products.length + results.categories.length;

  // keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => totalItems ? (i + 1) % totalItems : -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => totalItems ? (i - 1 + totalItems) % totalItems : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.products.length) {
        navigateTo(`/products/${results.products[activeIndex].slug}`);
      } else if (activeIndex >= results.products.length && activeIndex < totalItems) {
        navigateTo(`/category/${results.categories[activeIndex - results.products.length].slug}`);
      } else if (query.trim()) {
        navigateTo(`/products?search=${encodeURIComponent(query.trim())}`);
      }
    }
  }, [isOpen, activeIndex, totalItems, results, query]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function navigateTo(href) {
    if (query.trim().length >= 2) {
      saveRecent(query);
      logSearch(query); // fire-and-forget
    }
    setRecent(getRecent());
    onClose();
    router.push(href);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    trackSearch(query.trim());
    navigateTo(`/products?search=${encodeURIComponent(query.trim())}`);
  }

  function handleChipClick(text) {
    setQuery(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const hasResults = results.products.length > 0 || results.categories.length > 0;
  const showEmpty = debouncedQuery.trim() && !loading && !hasResults;
  const showDefault = !debouncedQuery.trim();
  const hasTrending = trending.pinned.length > 0 || trending.trending.length > 0;
  const hasRecent = recent.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-[6px]"
          />

          {/* panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
            className="fixed top-[6vh] left-1/2 -translate-x-1/2 z-[201] w-[96vw] max-w-2xl"
          >
            <div className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden border border-gray-100">

              {/* ── search input row ── */}
              <form onSubmit={handleSubmit} className="relative flex items-center">
                {/* animated left accent */}
                <motion.div
                  className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#B91C1C] to-[#ef4444] rounded-l-2xl"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 0.12, duration: 0.3, ease: "circOut" }}
                />

                <div className="pl-5 pr-2 shrink-0">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="spinner" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                        <Loader2 size={17} className="animate-spin text-[#B91C1C]" />
                      </motion.div>
                    ) : (
                      <motion.div key="icon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                        <Search size={17} strokeWidth={1.5} className="text-gray-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
                  placeholder="Search products, categories, tags…"
                  className="flex-1 py-[18px] text-[15px] text-gray-900 placeholder-gray-300 font-sans bg-transparent outline-none"
                  autoComplete="off"
                  spellCheck="false"
                />

                <div className="flex items-center gap-2 pr-4 shrink-0">
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition"
                      >
                        <X size={13} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={onClose}
                    className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-gray-300 border border-gray-200 rounded-md px-1.5 py-1 hover:border-gray-300 hover:text-gray-500 transition"
                  >
                    ESC
                  </button>
                </div>
              </form>

              {/* separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

              {/* ── body ── */}
              <div className="max-h-[62vh] overflow-y-auto overscroll-contain">

                {/* ── default (empty query) ── */}
                {showDefault && (
                  <div className="p-5 space-y-5">

                    {/* recent */}
                    {hasRecent && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Clock size={10} /> Recent
                          </p>
                          <button
                            onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                            className="text-[9px] text-gray-300 hover:text-[#B91C1C] uppercase tracking-wider transition font-bold"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recent.map(r => (
                            <Chip
                              key={r}
                              label={r}
                              onClick={() => handleChipClick(r)}
                              onRemove={() => { removeRecent(r); setRecent(getRecent()); }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* trending */}
                    {hasTrending && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-3">
                          <TrendingUp size={10} /> Trending
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* admin-pinned first */}
                          {trending.pinned.map(p => (
                            <Chip
                              key={p._id}
                              label={p.keyword}
                              icon={Pin}
                              iconColor="text-[#B91C1C]"
                              onClick={() => handleChipClick(p.keyword)}
                            />
                          ))}
                          {/* user-data trending */}
                          {trending.trending.map(t => (
                            <Chip
                              key={t}
                              label={t}
                              onClick={() => handleChipClick(t)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* no data at all */}
                    {!hasRecent && !hasTrending && (
                      <div className="py-8 text-center">
                        <Search size={28} className="text-gray-200 mx-auto mb-3" strokeWidth={1} />
                        <p className="text-xs text-gray-400 font-medium">Start typing to search products</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── empty state ── */}
                {showEmpty && (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Search size={18} className="text-gray-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-1">No results for "{debouncedQuery}"</p>
                    <p className="text-[11px] text-gray-400">Try different keywords or browse categories</p>
                  </div>
                )}

                {/* ── category pills ── */}
                {hasResults && results.categories.length > 0 && (
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {results.categories.map((cat, i) => {
                        const idx = results.products.length + i;
                        return (
                          <Link
                            key={cat._id}
                            href={`/category/${cat.slug}`}
                            onClick={() => { logSearch(query); saveRecent(query); setRecent(getRecent()); onClose(); }}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                              activeIndex === idx
                                ? "bg-[#B91C1C] text-white border-[#B91C1C]"
                                : "bg-white text-gray-700 border-gray-200 hover:border-[#B91C1C] hover:text-[#B91C1C]"
                            }`}
                          >
                            <Highlight text={cat.name} query={query} />
                            <ArrowRight size={10} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── product results ── */}
                {hasResults && results.products.length > 0 && (
                  <div className="pt-3 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-5 mb-1.5">Products</p>
                    <div className="divide-y divide-gray-50/80">
                      {results.products.map((p, i) => (
                        <ProductResult
                          key={p._id}
                          product={p}
                          query={query}
                          isActive={activeIndex === i}
                          onClick={() => { logSearch(query); saveRecent(query); setRecent(getRecent()); onClose(); }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── view all ── */}
                {hasResults && query.trim() && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <Link
                      href={`/products?search=${encodeURIComponent(query.trim())}`}
                      onClick={() => { logSearch(query); saveRecent(query); setRecent(getRecent()); onClose(); }}
                      className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#B91C1C] transition-colors group"
                    >
                      <span>View all results for "{query}"</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* keyboard hints */}
            <div className="flex items-center justify-center gap-5 mt-3 text-[10px] text-white/40 font-mono select-none">
              <span><kbd className="text-white/55">↑↓</kbd> navigate</span>
              <span><kbd className="text-white/55">↵</kbd> select</span>
              <span><kbd className="text-white/55">esc</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
