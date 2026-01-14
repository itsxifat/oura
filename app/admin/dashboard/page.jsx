'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard'; // Import the new action
import { LayoutDashboard, TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// --- TAKA SVG ---
const Taka = ({ size = 20, className = "" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    pendingOrders: 0,
    totalUsers: 0,
    lowStockItems: 0,
    recentOrders: [],
    systemStatus: 'Checking...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getDashboardStats();
      if (!data.error) {
        setStats(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8 relative overflow-hidden">
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="border-b border-gray-200 pb-6 flex justify-between items-end">
          <div>
             <h2 className="text-4xl font-bodoni text-black mb-2">Overview</h2>
             <p className="text-gray-500 text-sm tracking-wide">Welcome back to the OURA Command Center.</p>
          </div>
          <div className="text-right hidden md:block">
             <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Last Updated</p>
             <p className="text-sm font-mono">{new Date().toLocaleTimeString()}</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Revenue */}
          <StatCard 
             title="Total Revenue" 
             value={stats.revenue.toLocaleString()} 
             icon={TrendingUp} 
             isCurrency 
             loading={loading}
          />

          {/* Card 2: Pending Orders */}
          <StatCard 
             title="Pending Orders" 
             value={stats.pendingOrders} 
             icon={ShoppingBag} 
             loading={loading}
             highlight={stats.pendingOrders > 0}
          />

          {/* Card 3: Total Users */}
          <StatCard 
             title="Total Customers" 
             value={stats.totalUsers} 
             icon={Users} 
             loading={loading}
          />

          {/* Card 4: Low Stock Alert */}
          <StatCard 
             title="Low Stock Items" 
             value={stats.lowStockItems} 
             icon={AlertTriangle} 
             loading={loading}
             color="text-orange-500 bg-orange-50 border-orange-100"
          />

        </div>

        {/* Recent Activity Section */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bodoni text-xl text-black flex items-center gap-2">
                 <Clock size={18} className="text-[#800000]"/> Recent Activity
              </h3>
              <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#800000] transition-colors flex items-center gap-1">
                 View All <ArrowUpRight size={12}/>
              </button>
           </div>
           
           <div className="divide-y divide-gray-100">
              {loading ? (
                 <div className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest">Loading activity...</div>
              ) : stats.recentOrders.length === 0 ? (
                 <div className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest">No recent activity</div>
              ) : (
                 stats.recentOrders.map((order) => (
                    <div key={order._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                          <div>
                             <p className="text-sm font-bold text-gray-900">{order.guestInfo?.firstName || 'Guest'}</p>
                             <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{order.orderId}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 flex items-center justify-end gap-1"><Taka size={12}/>{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{new Date(order.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, isCurrency, loading, highlight, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-2xl border shadow-sm transition-all relative overflow-hidden group ${color || 'bg-white border-gray-200 hover:border-[#800000]/30'}`}
  >
     {/* Decorative BG Icon */}
     <Icon className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-50 group-hover:text-gray-100 transition-colors pointer-events-none" strokeWidth={1} />

     <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${highlight ? 'bg-[#800000] text-white shadow-lg shadow-[#800000]/20' : 'bg-gray-50 text-gray-400 group-hover:text-[#800000] group-hover:bg-[#800000]/5 transition-colors'}`}>
           <Icon size={20} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        <div className="text-3xl font-bodoni text-black flex items-center gap-1">
           {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse"/>
           ) : (
              <>
                 {isCurrency && <Taka size={24}/>}
                 {value}
              </>
           )}
        </div>
     </div>
  </motion.div>
);

const getStatusColor = (status) => {
   switch(status) {
      case 'Pending': return 'bg-yellow-400';
      case 'Processing': return 'bg-blue-500';
      case 'Delivered': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-300';
   }
};