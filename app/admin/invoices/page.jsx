'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getAdminOrders, backfillInvoiceNumbers } from '@/app/actions';
import { FileText, Download, Eye, Loader2, Receipt, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import InvoiceModal from '@/components/InvoiceTemplate';
import {
  Taka, AdminPageHeader, AdminStatCard, AdminFilterBar, AdminFilterRow,
  AdminSearchInput, CustomSelect, CustomDateRange, AdminLoadingScreen,
  AdminEmptyState, SortTh, PaymentMethodBadge, PaymentStatusBadge,
} from '@/app/admin/components/AdminUI';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString('en-BD');

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'bKash', label: 'bKash' },
  { value: 'SSLCommerz', label: 'SSL Commerz' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending COD' },
  { value: 'void', label: 'Void (Cancelled)' },
];

const methodLabel = (m) => m === 'SSLCommerz' ? 'SSL Commerz' : m === 'bKash' ? 'bKash' : 'COD';

const invoiceStatus = (order) => {
  if (order.status === 'Cancelled') return 'void';
  if (order.paymentStatus === 'Paid') return 'paid';
  return 'pending';
};

const STATUS_UI = {
  paid:    { bg: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2, label: 'Paid' },
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200',  Icon: Clock,       label: 'Pending' },
  void:    { bg: 'bg-gray-100 text-gray-500 border-gray-200',    Icon: XCircle,     label: 'Void' },
};

// ── main page ─────────────────────────────────────────────────────────────────
export default function AdminInvoicesPage() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [sortField, setSortField]       = useState('createdAt');
  const [sortDir, setSortDir]           = useState('desc');
  const [previewOrder, setPreviewOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    backfillInvoiceNumbers().then(() =>
      getAdminOrders().then(data => { setOrders(data); setLoading(false); })
    );
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const invoices = useMemo(() => {
    let list = orders.filter(o => {
      const inv = invoiceStatus(o);
      if (statusFilter !== 'all' && inv !== statusFilter) return false;
      if (methodFilter !== 'all' && o.paymentMethod !== methodFilter) return false;
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o.invoiceNumber?.toLowerCase().includes(q) ||
        o.orderId?.toLowerCase().includes(q) ||
        `${o.guestInfo?.firstName} ${o.guestInfo?.lastName}`.toLowerCase().includes(q) ||
        o.guestInfo?.phone?.includes(q) ||
        o.guestInfo?.email?.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      let av, bv;
      if (sortField === 'createdAt')    { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
      else if (sortField === 'totalAmount') { av = a.totalAmount; bv = b.totalAmount; }
      else if (sortField === 'invoiceNumber') { av = a.invoiceNumber ?? ''; bv = b.invoiceNumber ?? ''; }
      else { av = a[sortField]; bv = b[sortField]; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [orders, search, statusFilter, methodFilter, dateFrom, dateTo, sortField, sortDir]);

  const stats = useMemo(() => {
    const all     = orders.filter(o => o.status !== 'Cancelled');
    const paid    = all.filter(o => o.paymentStatus === 'Paid');
    const pending = all.filter(o => o.paymentStatus !== 'Paid');
    return {
      total:       all.length,
      totalRev:    all.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
      paidCount:   paid.length,
      paidRev:     paid.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
      pendingCount: pending.length,
      pendingRev:  pending.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
      rate:        all.length ? Math.round((paid.length / all.length) * 100) : 0,
    };
  }, [orders]);

  const downloadPDF = useCallback(async (order) => {
    setDownloadingId(order._id);
    try {
      const res  = await fetch('/api/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `${order.invoiceNumber || order.orderId}.pdf` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally { setDownloadingId(null); }
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 lg:pt-0">
      <AdminLoadingScreen label="Loading Invoices…"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      {previewOrder && <InvoiceModal order={previewOrder} onClose={() => setPreviewOrder(null)}/>}

      <AdminPageHeader eyebrow="Finance" title="Invoices" count={invoices.length} countLabel="invoices"/>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminStatCard label="Total Invoices"   value={stats.total}       sub={`৳ ${fmt(stats.totalRev)}`}   icon={FileText}     color="bg-gray-100 text-gray-600"/>
          <AdminStatCard label="Paid"             value={stats.paidCount}   sub={`৳ ${fmt(stats.paidRev)}`}    icon={CheckCircle2} color="bg-green-100 text-green-700"/>
          <AdminStatCard label="Pending COD"      value={stats.pendingCount} sub={`৳ ${fmt(stats.pendingRev)}`} icon={Clock}        color="bg-amber-100 text-amber-700"/>
          <AdminStatCard label="Collection Rate"  value={`${stats.rate}%`}  sub={`${stats.paidCount} of ${stats.total} paid`} icon={TrendingUp} color="bg-blue-100 text-blue-700"/>
        </div>

        {/* Filters */}
        <AdminFilterBar>
          <AdminFilterRow>
            <AdminSearchInput value={search} onChange={setSearch} placeholder="Invoice #, Order #, Name, Phone…" className="sm:col-span-2"/>
            <CustomSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS}/>
            <CustomSelect value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS}/>
          </AdminFilterRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomDateRange from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo}/>
          </div>
        </AdminFilterBar>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {invoices.length === 0 ? (
            <AdminEmptyState icon={Receipt} title="No invoices found" subtitle="Try adjusting your filters"/>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortTh field="invoiceNumber" sortField={sortField} sortDir={sortDir} onSort={toggleSort}>Invoice #</SortTh>
                    <SortTh field="createdAt"     sortField={sortField} sortDir={sortDir} onSort={toggleSort}>Date</SortTh>
                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Order</th>
                    <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Method</th>
                    <SortTh field="totalAmount"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-right">Amount</SortTh>
                    <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(order => {
                    const inv   = invoiceStatus(order);
                    const style = STATUS_UI[inv];
                    const isDownloading = downloadingId === order._id;

                    return (
                      <motion.tr key={order._id} layout className="hover:bg-gray-50/70 transition-colors group">

                        {/* Invoice # */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-bold text-black tracking-wide">
                            {order.invoiceNumber || <span className="text-gray-300 italic font-normal text-[10px]">—</span>}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-gray-900">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.guestInfo?.phone}</p>
                          {order.guestInfo?.email && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{order.guestInfo.email}</p>}
                        </td>

                        {/* Order */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-[11px] font-bold text-[#800000]">{order.orderId}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        </td>

                        {/* Method */}
                        <td className="px-4 py-4 text-center">
                          <PaymentMethodBadge method={order.paymentMethod}/>
                          {order.paymentTransactionId && (
                            <p className="text-[9px] text-gray-300 font-mono mt-1 max-w-[110px] truncate mx-auto" title={order.paymentTransactionId}>
                              {order.paymentTransactionId}
                            </p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-bold text-gray-900"><Taka size={11}/>  {fmt(order.totalAmount)}</p>
                          {(order.discountAmount ?? 0) > 0 && (
                            <p className="text-[10px] text-[#800000] mt-0.5">−<Taka size={9}/>{fmt(order.discountAmount)}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border ${style.bg}`}>
                            <style.Icon size={10}/>{style.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setPreviewOrder(order)}
                              title="Preview Invoice"
                              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                            >
                              <Eye size={15}/>
                            </button>
                            <button
                              onClick={() => downloadPDF(order)}
                              disabled={isDownloading}
                              title="Download PDF"
                              className="p-2 rounded-lg text-gray-400 hover:text-[#800000] hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              {isDownloading ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[10px] text-gray-400 font-black uppercase tracking-widest">
              <span>Showing {invoices.length} of {orders.length} invoices</span>
              <span>Total: <Taka size={10}/>{fmt(invoices.reduce((s, o) => s + (o.totalAmount ?? 0), 0))}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
