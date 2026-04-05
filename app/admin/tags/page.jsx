'use client';

import { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag, getProductsByTag } from '@/app/actions';
import { Tag as TagIcon, Plus, Trash2, Package, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Taka, AdminPageHeader, AdminLoadingScreen, AdminEmptyState, AdminCard,
} from '@/app/admin/components/AdminUI';

const fmt = (n) => Number(n ?? 0).toLocaleString('en-BD');

export default function TagsPage() {
  const [tags, setTags]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedTag, setSelectedTag]     = useState(null);
  const [products, setProducts]           = useState([]);
  const [prodsLoading, setProdsLoading]   = useState(false);
  const [newName, setNewName]             = useState('');
  const [newColor, setNewColor]           = useState('#800000');
  const [creating, setCreating]           = useState(false);
  const [deletingId, setDeletingId]       = useState(null);

  const load = async () => {
    const data = await getTags();
    setTags(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const fd = new FormData();
    fd.append('name', newName.trim());
    fd.append('color', newColor);
    await createTag(fd);
    setNewName('');
    await load();
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tag? Products will be untagged but not deleted.')) return;
    setDeletingId(id);
    await deleteTag(id);
    if (selectedTag?._id === id) { setSelectedTag(null); setProducts([]); }
    await load();
    setDeletingId(null);
  };

  const selectTag = async (tag) => {
    setSelectedTag(tag);
    setProdsLoading(true);
    setProducts([]);
    const prods = await getProductsByTag(tag._id);
    setProducts(prods);
    setProdsLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 lg:pt-0">
      <AdminLoadingScreen label="Loading Tags…"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      <AdminPageHeader eyebrow="Organization" title="Product Tags" count={tags.length} countLabel="tags"/>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left: create + tag list ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Create form */}
            <AdminCard>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-4 flex items-center gap-2">
                <Plus size={12} className="text-[#800000]"/> New Tag
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Tag Name</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Summer Sale"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#800000]/40 focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Badge Color</label>
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-300 shadow-sm shrink-0">
                      <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-0 p-0 m-0"
                      />
                    </div>
                    <span
                      className="flex-1 text-xs font-black uppercase px-2.5 py-1 rounded-lg border"
                      style={{ backgroundColor: `${newColor}18`, color: newColor, borderColor: `${newColor}30` }}
                    >
                      {newName || 'Preview'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{newColor}</span>
                  </div>
                </div>
                <button
                  disabled={creating || !newName.trim()}
                  className="w-full bg-[#800000] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#800000]/20"
                >
                  {creating ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                  {creating ? 'Creating…' : 'Create Tag'}
                </button>
              </form>
            </AdminCard>

            {/* Tag list */}
            <AdminCard noPad>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Active Tags ({tags.length})</p>
              </div>
              {tags.length === 0 ? (
                <div className="py-10 text-center">
                  <TagIcon size={24} className="mx-auto text-gray-200 mb-2"/>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No tags yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tags.map(tag => (
                    <motion.div
                      key={tag._id}
                      onClick={() => selectTag(tag)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all group
                        ${selectedTag?._id === tag._id ? 'bg-[#800000]/5 border-l-2 border-[#800000]' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow" style={{ backgroundColor: tag.color }}/>
                        <span
                          className={`font-bold text-sm truncate transition-colors
                            ${selectedTag?._id === tag._id ? 'text-[#800000]' : 'text-gray-700 group-hover:text-black'}`}
                        >
                          {tag.name}
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(tag._id); }}
                        disabled={deletingId === tag._id}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-40"
                      >
                        {deletingId === tag._id ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>

          {/* ── Right: products in tag ── */}
          <div className="lg:col-span-8">
            <AdminCard noPad className="min-h-[400px] lg:min-h-[600px] flex flex-col">

              {selectedTag ? (
                <>
                  {/* Tag header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                        style={{ backgroundColor: selectedTag.color }}
                      >
                        <TagIcon size={16}/>
                      </div>
                      <div>
                        <h2 className="font-bodoni text-xl text-black leading-none">{selectedTag.name}</h2>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">Tagged Inventory</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {prodsLoading ? '…' : `${products.length} items`}
                      </span>
                      <button
                        onClick={() => { setSelectedTag(null); setProducts([]); }}
                        className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                      >
                        <X size={15}/>
                      </button>
                    </div>
                  </div>

                  {/* Product grid */}
                  <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
                    {prodsLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 size={28} className="animate-spin text-[#800000]"/>
                      </div>
                    ) : products.length === 0 ? (
                      <AdminEmptyState
                        icon={Package}
                        title="No products tagged"
                        subtitle="Go to Products to assign this tag"
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {products.map((p, i) => (
                            <motion.div
                              key={p._id}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#800000]/30 hover:bg-white hover:shadow-md transition-all group"
                            >
                              <div className="w-14 h-18 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                {p.images?.[0]
                                  ? <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                                  : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={16}/></div>}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="font-bold text-sm text-gray-900 truncate group-hover:text-[#800000] transition-colors">{p.name}</p>
                                <p className="text-[10px] font-mono text-gray-400 mt-0.5">{p.sku || '—'}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="font-bold text-xs text-[#800000]"><Taka size={10}/>{fmt(p.price)}</span>
                                  <Link href={`/admin/products/${p._id}`}
                                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#800000] transition-colors"
                                  >
                                    Edit →
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Empty selection */
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-5">
                    <TagIcon size={32} className="text-gray-200"/>
                  </div>
                  <p className="font-bodoni text-xl text-gray-400 mb-1">Select a Tag</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Choose a tag from the left to view its products</p>
                </div>
              )}
            </AdminCard>
          </div>

        </div>
      </div>
    </div>
  );
}
