'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard';
import { LayoutDashboard, TrendingUp, Users, ShoppingBag, Clock, AlertTriangle, ArrowUpRight, Package, Check, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Taka, AdminPageHeader, AdminStatCard, AdminLoadingScreen } from '@/app/admin/components/AdminUI';

const STATUS_DOT = {
  Pending:    'bg-amber-400',
  Processing: 'bg-blue-500',
  Shipped:    'bg-violet-500',
  Delivered:  'bg-green-500',
  Cancelled:  'bg-red-500',
};

const STATUS_ICON = {
  Delivered: <Check size={11} className="text-green-600"/>,
  Cancelled: <XCircle size={11} className="text-red-500"/>,
  Pending:   <Clock size={11} className="text-amber-500"/>,
};

const fmt = (n) => Number(n ?? 0).toLocaleString('en-BD');

const stagger = { visible: { transition: { staggerChildren: 0.07 } }, hidden: {} };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function DashboardPage() {
  const [stats, setStats]     = useState({ revenue: 0, pendingOrders: 0, totalUsers: 0, lowStockItems: 0, recentOrders: [] });
  const [loading, setLoading] = useState(true);
  const [time, setTime]       = useState('');

  useEffect(() => {
    getDashboardStats().then(d => { if (!d.error) setStats(d); setLoading(false); });
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] pt-16 lg:pt-0">
      <AdminLoadingScreen label="Loading Dashboard…"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      <AdminPageHeader eyebrow="Command Center" title="Dashboard">
        <span className="hidden sm:block font-mono text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl tabular-nums">
          {time}
        </span>
      </AdminPageHeader>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

          {/* Stat cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AdminStatCard
              label="Total Revenue"
              value={<span className="flex items-center gap-0.5"><Taka size={20}/>{fmt(stats.revenue)}</span>}
              icon={TrendingUp}
              color="bg-[#800000]/10 text-[#800000]"
            />
            <AdminStatCard
              label="Pending Orders"
              value={stats.pendingOrders}
              icon={ShoppingBag}
              color={stats.pendingOrders > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}
              highlight={stats.pendingOrders > 0}
            />
            <AdminStatCard
              label="Total Customers"
              value={stats.totalUsers}
              icon={Users}
              color="bg-blue-100 text-blue-700"
            />
            <AdminStatCard
              label="Low Stock Items"
              value={stats.lowStockItems}
              icon={AlertTriangle}
              color={stats.lowStockItems > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}
              highlight={stats.lowStockItems > 0}
            />
          </motion.div>

          {/* Quick links row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/admin/orders',   label: 'Orders',   icon: Package,       color: 'hover:border-amber-300 hover:bg-amber-50' },
              { href: '/admin/products', label: 'Products', icon: ShoppingBag,   color: 'hover:border-blue-300 hover:bg-blue-50' },
              { href: '/admin/invoices', label: 'Invoices', icon: TrendingUp,    color: 'hover:border-green-300 hover:bg-green-50' },
              { href: '/admin/users',    label: 'Customers', icon: Users,        color: 'hover:border-violet-300 hover:bg-violet-50' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}
                className={`bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between group transition-all shadow-sm ${color}`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-black transition-colors">Manage</p>
                </div>
                <div className="flex items-center gap-1 text-gray-300 group-hover:text-gray-600 transition-colors">
                  <Icon size={18} strokeWidth={1.5}/>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Recent orders */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bodoni text-lg sm:text-xl text-black flex items-center gap-2">
                <Clock size={16} className="text-[#800000]"/> Recent Activity
              </h3>
              <Link href="/admin/orders" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#800000] transition-colors">
                View All <ArrowUpRight size={12}/>
              </Link>
            </div>

            {stats.recentOrders.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-[10px] uppercase tracking-widest font-bold">No recent activity</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentOrders.map(order => (
                  <motion.div
                    key={order._id}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-gray-50/70 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] ?? 'bg-gray-300'}`}/>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {order.guestInfo?.firstName || 'Guest'} {order.guestInfo?.lastName || ''}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.orderId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:text-right pl-5 sm:pl-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border
                        ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'}`}
                      >
                        {STATUS_ICON[order.status] ?? <Clock size={9}/>}
                        {order.status}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 flex items-center justify-end gap-0.5">
                          <Taka size={12}/>{fmt(order.totalAmount)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
