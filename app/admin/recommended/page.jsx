'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  searchProductsForRecommended,
  getDefaultRecommendedProductIds,
  setDefaultRecommendedProducts,
} from '@/actions/recommended';
import {
  Search, Star, X, GripVertical, ArrowUp, ArrowDown,
  Loader2, Check, Package, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import gsap from 'gsap';

export default function RecommendedAdminPage() {
  const containerRef = useRef(null);

  const [selected, setSelected] = useState([]); // { _id, name, images, price, category }
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing selection on mount
  useEffect(() => {
    async function init() {
      const ids = await getDefaultRecommendedProductIds();
      if (ids.length) {
        // Fetch full data for those ids by searching with empty query then filtering
        const all = await searchProductsForRecommended('');
        const ordered = ids
          .map(id => all.find(p => p._id === id))
          .filter(Boolean);
        setSelected(ordered);
      }
      setInitialLoading(false);
    }
    init();
    // Initial search to populate results
    handleSearch('');
  }, []);

  useEffect(() => {
    if (!initialLoading && containerRef.current) {
      gsap.fromTo(
        '.anim-entry',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
      );
    }
  }, [initialLoading]);

  async function handleSearch(q) {
    setSearching(true);
    const data = await searchProductsForRecommended(q);
    setResults(data);
    setSearching(false);
  }

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    // debounce-like: search on every keystroke after brief delay
    clearTimeout(window._recSearch);
    window._recSearch = setTimeout(() => handleSearch(val), 300);
  }

  function addProduct(product) {
    if (selected.length >= 10) return;
    if (selected.find(p => p._id === product._id)) return;
    setSelected(prev => [...prev, product]);
    setSaved(false);
  }

  function removeProduct(id) {
    setSelected(prev => prev.filter(p => p._id !== id));
    setSaved(false);
  }

  function moveItem(idx, dir) {
    const next = [...selected];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSelected(next);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const ids = selected.map(p => p._id);
    const res = await setDefaultRecommendedProducts(ids);
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const format = (n) => new Intl.NumberFormat('en-BD').format(n || 0);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B91C1C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8" ref={containerRef}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6 anim-entry">
          <div>
            <span className="text-[#B91C1C] font-bold uppercase tracking-[0.3em] text-[10px]">
              Personalization
            </span>
            <h1 className="font-bodoni text-4xl mt-2 text-black">Default Recommendations</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">
              Select up to 10 products shown to new visitors who have no browsing history.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-[#B91C1C] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black disabled:opacity-40 transition-all shadow-lg shadow-[#B91C1C]/20"
          >
            {saving ? (
              <><Loader2 size={13} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={13} /> Saved!</>
            ) : (
              <><Star size={13} /> Save Selection</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Product Search */}
          <div className="lg:col-span-5 space-y-4 anim-entry">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-4">
                  <Search size={13} className="text-[#B91C1C]" />
                  Search Products
                </h3>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search by product name…"
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:bg-white focus:border-[#B91C1C] transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
                {searching && (
                  <div className="py-8 flex justify-center">
                    <div className="w-5 h-5 border-2 border-[#B91C1C] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!searching && results.length === 0 && (
                  <div className="py-10 text-center text-gray-400">
                    <Package size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase">No products found</p>
                  </div>
                )}
                {!searching && results.map(product => {
                  const isAdded = !!selected.find(p => p._id === product._id);
                  return (
                    <button
                      key={product._id}
                      onClick={() => isAdded ? removeProduct(product._id) : addProduct(product)}
                      disabled={!isAdded && selected.length >= 10}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-gray-50 group disabled:opacity-40 disabled:cursor-not-allowed
                        ${isAdded ? 'bg-[#B91C1C]/5 border-l-2 border-[#B91C1C]' : ''}
                      `}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                          {product.category?.name} · ৳{format(product.price)}
                        </p>
                      </div>
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all
                        ${isAdded
                          ? 'bg-[#B91C1C] border-[#B91C1C] text-white'
                          : 'border-gray-200 text-gray-300 group-hover:border-[#B91C1C] group-hover:text-[#B91C1C]'
                        }`}>
                        {isAdded ? <Check size={12} /> : <span className="text-xs font-bold">+</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Products */}
          <div className="lg:col-span-7 anim-entry">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#B91C1C]/10 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#B91C1C]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-black">Selected Products</h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                      Shown to new users · max 10
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest
                  ${selected.length >= 10 ? 'bg-[#B91C1C] text-white' : 'bg-gray-900 text-white'}
                `}>
                  {selected.length} / 10
                </div>
              </div>

              <div className="p-4">
                {selected.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={28} className="opacity-30" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">No products selected</p>
                    <p className="text-[10px] mt-1 text-gray-400">Search and add products from the left panel</p>
                  </div>
                )}

                <Reorder.Group
                  axis="y"
                  values={selected}
                  onReorder={(newOrder) => { setSelected(newOrder); setSaved(false); }}
                  className="space-y-2"
                >
                  <AnimatePresence>
                    {selected.map((product, idx) => (
                      <Reorder.Item
                        key={product._id}
                        value={product}
                        className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[#B91C1C]/30 hover:shadow-sm transition-all group"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        {/* Rank */}
                        <div className="w-6 h-6 rounded-full bg-[#B91C1C]/10 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-[#B91C1C]">{idx + 1}</span>
                        </div>

                        <GripVertical size={14} className="text-gray-300 shrink-0" />

                        {/* Image */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          {product.images?.[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {product.category?.name} · ৳{format(product.price)}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition rounded"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === selected.length - 1}
                            className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition rounded"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => removeProduct(product._id)}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>

                {selected.length > 0 && (
                  <p className="text-[10px] text-gray-400 text-center mt-4 font-medium">
                    Drag to reorder · position determines display order in Recommended section
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
