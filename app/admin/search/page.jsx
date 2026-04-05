'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getPinnedSearches, addPinnedSearch, deletePinnedSearch,
  reorderPinnedSearches, getSearchAnalytics,
} from '@/actions/search';
import {
  Search, Pin, PinOff, Plus, Trash2, Loader2,
  TrendingUp, BarChart2, GripVertical, ArrowUp, ArrowDown,
  Hash, Activity,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import gsap from 'gsap';

export default function SearchAdminPage() {
  const containerRef = useRef(null);

  // pinned state
  const [pinned, setPinned] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadPinned();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!pinnedLoading && !analyticsLoading && containerRef.current) {
      gsap.fromTo(
        '.anim-entry',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [pinnedLoading, analyticsLoading]);

  async function loadPinned() {
    setPinnedLoading(true);
    const data = await getPinnedSearches();
    setPinned(data);
    setPinnedLoading(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    const data = await getSearchAnalytics();
    setAnalytics(data);
    setAnalyticsLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await addPinnedSearch(newKeyword.trim());
      setNewKeyword('');
      await loadPinned();
    } catch (err) {
      setAddError(err.message || 'Failed to add keyword');
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    if (!confirm('Remove this pinned keyword?')) return;
    await deletePinnedSearch(id);
    setPinned(prev => prev.filter(p => p._id !== id));
  }

  async function handleReorder(newOrder) {
    setPinned(newOrder);
    await reorderPinnedSearches(newOrder.map(p => p._id));
  }

  async function moveItem(idx, dir) {
    const next = [...pinned];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await handleReorder(next);
  }

  const maxCount = analytics?.topKeywords?.[0]?.count || 1;

  return (
    <div
      className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── header ── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.3em] text-[10px]">
              Discovery
            </span>
            <h1 className="font-bodoni text-4xl mt-2 text-black">Search Management</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">
              Pin trending keywords and view search analytics from your customers.
            </p>
          </div>
          {analytics && (
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
              <Activity size={14} className="text-[#800000]" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {analytics.total.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total Searches Logged</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: pinned manager (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* add form */}
            <div className="anim-entry bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#800000]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-all group-hover:bg-[#800000]/10" />

              <h3 className="font-bold text-xs uppercase tracking-widest mb-5 text-gray-900 flex items-center gap-2">
                <Pin size={13} className="text-[#800000]" />
                Pin a Keyword
              </h3>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Keyword
                  </label>
                  <input
                    value={newKeyword}
                    onChange={e => { setNewKeyword(e.target.value); setAddError(''); }}
                    placeholder="e.g. Eid Collection"
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:border-[#800000] transition-all placeholder:text-gray-300"
                  />
                  <AnimatePresence>
                    {addError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-[10px] text-red-500 font-semibold mt-1.5 ml-1"
                      >
                        {addError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  disabled={adding || !newKeyword.trim()}
                  className="w-full bg-[#800000] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#800000]/20"
                >
                  {adding ? <Loader2 className="animate-spin" size={13} /> : <Plus size={13} />}
                  {adding ? 'Pinning…' : 'Pin Keyword'}
                </button>
              </form>
            </div>

            {/* pinned list */}
            <div className="anim-entry space-y-2">
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Pin size={11} className="text-[#800000]" /> Pinned Keywords
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {pinned.length} keyword{pinned.length !== 1 ? 's' : ''}
                </span>
              </div>

              {pinnedLoading && (
                <div className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}

              {!pinnedLoading && pinned.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <PinOff size={22} className="mx-auto mb-2 opacity-20" />
                  <span className="text-[10px] uppercase font-bold">No pinned keywords</span>
                </div>
              )}

              {!pinnedLoading && pinned.length > 0 && (
                <Reorder.Group axis="y" values={pinned} onReorder={handleReorder} className="space-y-2">
                  {pinned.map((item, idx) => (
                    <Reorder.Item
                      key={item._id}
                      value={item}
                      className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-[#800000]/30 hover:shadow-md transition-all group"
                    >
                      <GripVertical size={14} className="text-gray-300 shrink-0 group-hover:text-gray-400" />

                      <div className="w-6 h-6 rounded-full bg-[#800000]/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-[#800000]">{idx + 1}</span>
                      </div>

                      <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                        {item.keyword}
                      </span>

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
                          disabled={idx === pinned.length - 1}
                          className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition rounded"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition ml-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              {pinned.length > 0 && (
                <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
                  Drag to reorder · shown first in search
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT: analytics (8 cols) ── */}
          <div className="lg:col-span-8">
            <div className="anim-entry bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col relative">

              {/* dot pattern bg */}
              <div
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
              />

              {/* header */}
              <div className="p-7 border-b border-gray-100 bg-white/80 backdrop-blur-md relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#800000]/10 flex items-center justify-center">
                      <BarChart2 size={18} className="text-[#800000]" />
                    </div>
                    <div>
                      <h2 className="font-bodoni text-3xl text-black leading-none">Search Analytics</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1.5 font-bold">
                        Top searched keywords · last 1,000 entries
                      </p>
                    </div>
                  </div>
                  {analytics && (
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg">
                      {analytics.topKeywords.length} Terms
                    </div>
                  )}
                </div>
              </div>

              {/* content */}
              <div className="flex-1 p-7 relative z-10 overflow-y-auto">
                {analyticsLoading && (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#800000] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!analyticsLoading && analytics?.topKeywords?.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                      <TrendingUp size={32} className="opacity-20 text-gray-400" />
                    </div>
                    <h3 className="font-bodoni text-xl text-gray-400 mb-2">No data yet</h3>
                    <p className="text-[11px] uppercase tracking-widest font-bold opacity-60">
                      Searches will appear here as users interact
                    </p>
                  </div>
                )}

                {!analyticsLoading && analytics?.topKeywords?.length > 0 && (
                  <div className="space-y-3">
                    {analytics.topKeywords.map((item, i) => {
                      const pct = Math.round((item.count / maxCount) * 100);
                      const isPinned = pinned.some(
                        p => p.keyword.toLowerCase() === item.keyword.toLowerCase()
                      );
                      const medals = ['🥇', '🥈', '🥉'];

                      return (
                        <motion.div
                          key={item.keyword}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#800000]/30 hover:shadow-sm transition-all"
                        >
                          {/* rank */}
                          <div className="w-8 shrink-0 text-center">
                            {i < 3
                              ? <span className="text-lg">{medals[i]}</span>
                              : <span className="text-xs font-black text-gray-400 font-mono">#{i + 1}</span>
                            }
                          </div>

                          {/* keyword + bar */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Hash size={10} className="text-gray-300 shrink-0" />
                              <span className="text-sm font-bold text-gray-900 capitalize truncate">
                                {item.keyword}
                              </span>
                              {isPinned && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#800000] bg-[#800000]/10 px-1.5 py-0.5 rounded-full shrink-0">
                                  <Pin size={8} /> Pinned
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: i * 0.04, ease: 'circOut' }}
                                className="h-full rounded-full"
                                style={{
                                  background: i === 0
                                    ? 'linear-gradient(90deg, #B91C1C, #ef4444)'
                                    : i === 1
                                    ? 'linear-gradient(90deg, #800000, #B91C1C)'
                                    : '#e5e7eb',
                                }}
                              />
                            </div>
                          </div>

                          {/* count + pin action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-black text-gray-900">{item.count}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-bold">searches</p>
                            </div>
                            {!isPinned && (
                              <button
                                onClick={async () => {
                                  try {
                                    await addPinnedSearch(item.keyword);
                                    await loadPinned();
                                  } catch (_) {}
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-[#800000] hover:bg-[#800000]/10 rounded-lg transition-all"
                                title="Pin this keyword"
                              >
                                <Pin size={13} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
