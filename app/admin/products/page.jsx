'use client';

import Link from 'next/link';
import { Plus, Trash2, Package, Edit3, X, Check, AlertTriangle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getAdminProducts, deleteProduct, getCategories, getTags, updateProductTags } from '@/app/actions';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Taka, AdminPageHeader, AdminFilterBar, AdminFilterRow,
  AdminSearchInput, CustomSelect, AdminLoadingScreen, AdminEmptyState, AdminCard,
} from '@/app/admin/components/AdminUI';

// ── flatten categories tree ───────────────────────────────────────────────────
const flattenCategories = (cats, depth = 0) => {
  let flat = [];
  cats.forEach(c => {
    flat.push({ _id: c._id, name: c.name, label: `${'  '.repeat(depth * 2)}${c.name}` });
    if (c.children?.length) flat = flat.concat(flattenCategories(c.children, depth + 1));
  });
  return flat;
};

const fmt = (n) => Number(n ?? 0).toLocaleString('en-BD');

// ── quick tag modal ───────────────────────────────────────────────────────────
function QuickTagModal({ product, availableTags, onClose, onUpdate }) {
  const [selected, setSelected] = useState(product.tags?.map(t => t._id) ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const save = async () => {
    setSaving(true);
    await updateProductTags(product._id, selected);
    await onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
      >
        <div className="px-5 py-4 bg-[#800000] text-white flex justify-between items-center">
          <h3 className="font-bodoni text-xl">Manage Tags</h3>
          <button onClick={onClose} className="bg-white/15 p-1.5 rounded-xl hover:bg-white/25 transition-colors"><X size={16}/></button>
        </div>
        <div className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Tags for "{product.name}"</p>
          <div className="flex flex-wrap gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
            {availableTags.map(tag => {
              const active = selected.includes(tag._id);
              return (
                <button key={tag._id} onClick={() => toggle(tag._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border transition-all
                    ${active ? 'bg-[#800000] text-white border-[#800000] shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {active && <Check size={10}/>} {tag.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="bg-[#800000] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors shadow-lg flex items-center gap-2"
          >
            {saving && <Loader2 size={12} className="animate-spin"/>} Save Tags
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── stock badge ───────────────────────────────────────────────────────────────
function StockBadge({ stock }) {
  if (stock > 10) return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>{stock} in stock</span>;
  if (stock > 0)  return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertTriangle size={9}/>Low: {stock}</span>;
  return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Out of Stock</span>;
}

// ── main page ─────────────────────────────────────────────────────────────────
const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in',  label: 'In Stock' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'low', label: 'Low Stock (≤10)' },
];

export default function AdminProductsPage() {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [tags, setTags]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('all');
  const [filterTag, setFilterTag]     = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [tagModal, setTagModal]       = useState(null);
  const [deletingId, setDeletingId]   = useState(null);

  const load = async () => {
    setLoading(true);
    const [prods, cats, tgs] = await Promise.all([getAdminProducts(), getCategories(), getTags()]);
    setProducts(prods);
    setCategories(flattenCategories(cats));
    setTags(tgs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q) && !p.barcode?.toLowerCase().includes(q)) return false;
    if (filterCat !== 'all' && p.category?._id !== filterCat) return false;
    if (filterTag !== 'all' && !p.tags?.some(t => t._id === filterTag)) return false;
    if (filterStock === 'in'  && p.stock <= 0)  return false;
    if (filterStock === 'out' && p.stock > 0)   return false;
    if (filterStock === 'low' && (p.stock <= 0 || p.stock > 10)) return false;
    return true;
  }), [products, search, filterCat, filterTag, filterStock]);

  const catOptions = [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c._id, label: c.label }))];
  const tagOptions = [{ value: 'all', label: 'All Tags' },       ...tags.map(t => ({ value: t._id, label: t.name }))];

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this product?')) return;
    setDeletingId(id);
    await deleteProduct(id);
    await load();
    setDeletingId(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 lg:pt-0">
      <AdminLoadingScreen label="Loading Products…"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      <AnimatePresence>
        {tagModal && <QuickTagModal product={tagModal} availableTags={tags} onClose={() => setTagModal(null)} onUpdate={load}/>}
      </AnimatePresence>

      <AdminPageHeader eyebrow="Inventory" title="Products" count={filtered.length} countLabel="products">
        <Link href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#800000] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-[#800000]/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={14}/> Add Product
        </Link>
      </AdminPageHeader>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* Filters */}
        <AdminFilterBar>
          <AdminFilterRow>
            <AdminSearchInput value={search} onChange={setSearch} placeholder="Name, SKU, Barcode…" className="sm:col-span-2"/>
            <CustomSelect value={filterCat}   onChange={setFilterCat}   options={catOptions}/>
            <CustomSelect value={filterTag}   onChange={setFilterTag}   options={tagOptions}/>
            <CustomSelect value={filterStock} onChange={setFilterStock} options={STOCK_OPTIONS}/>
          </AdminFilterRow>
        </AdminFilterBar>

        {/* Table card */}
        <AdminCard noPad>
          {filtered.length === 0 ? (
            <AdminEmptyState icon={Package} title="No products found" subtitle="Try adjusting your filters or add a new product"/>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filtered.map(p => (
                  <div key={p._id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18}/></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm text-black truncate">{p.name}</p>
                        <div className="flex gap-1 shrink-0">
                          <Link href={`/admin/products/${p._id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"><Edit3 size={14}/></Link>
                          <button onClick={() => handleDelete(p._id)} disabled={deletingId === p._id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            {deletingId === p._id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{p.sku || '—'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="font-bold text-sm text-[#800000]"><Taka size={11}/>{fmt(p.price)}</span>
                        <StockBadge stock={p.stock}/>
                      </div>
                      {p.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {p.tags.slice(0, 3).map(t => (
                            <span key={t._id} className="text-[9px] font-black uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{t.name}</span>
                          ))}
                          {p.tags.length > 3 && <span className="text-[9px] text-gray-400 font-bold">+{p.tags.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Product', 'Category / Tags', 'Stock', 'Price', ''].map(h => (
                        <th key={h} className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 ${h === 'Price' || h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50/70 transition-colors group">

                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-13 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                              {p.images?.[0]
                                ? <img src={p.images[0]} alt="" className="w-full h-full object-cover"/>
                                : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14}/></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-900 truncate max-w-[200px] group-hover:text-[#800000] transition-colors">{p.name}</p>
                              <div className="flex gap-2 mt-0.5">
                                {p.sku && <span className="text-[9px] font-mono bg-gray-100 px-1.5 rounded text-gray-500 border border-gray-200">{p.sku}</span>}
                                {p.barcode && <span className="text-[9px] font-mono bg-gray-100 px-1.5 rounded text-gray-500 border border-gray-200">{p.barcode}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category / Tags */}
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-1">{p.category?.name || '—'}</p>
                          <div className="flex flex-wrap gap-1">
                            {p.tags?.slice(0, 3).map(t => (
                              <span key={t._id} className="text-[9px] font-black uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{t.name}</span>
                            ))}
                            {(p.tags?.length ?? 0) > 3 && <span className="text-[9px] text-gray-400 font-bold">+{p.tags.length - 3}</span>}
                            <button
                              onClick={() => setTagModal(p)}
                              className="text-[9px] font-black uppercase bg-gray-50 hover:bg-[#800000] hover:text-white px-1.5 py-0.5 rounded border border-gray-200 hover:border-[#800000] transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Plus size={9}/>
                            </button>
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3">
                          <StockBadge stock={p.stock}/>
                          {p.variants?.length > 0 && (
                            <p className="text-[9px] font-mono text-gray-400 mt-1">
                              {p.variants.slice(0, 3).map(v => `${v.size}:${v.stock}`).join(' · ')}
                              {p.variants.length > 3 && '…'}
                            </p>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-sm text-gray-900"><Taka size={11}/>{fmt(p.price)}</p>
                          {p.discountPrice && (
                            <p className="text-[9px] font-bold text-[#800000] mt-0.5">Sale: <Taka size={8}/>{fmt(p.discountPrice)}</p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/products/${p._id}`}
                              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                            >
                              <Edit3 size={14}/>
                            </Link>
                            <button onClick={() => handleDelete(p._id)} disabled={deletingId === p._id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 disabled:opacity-40"
                            >
                              {deletingId === p._id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </AdminCard>

        {filtered.length > 0 && (
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-right px-1">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </div>
    </div>
  );
}
