import connectDB from '@/lib/db';
import { getCoupons, getTopCategories, deleteCoupon } from '@/app/actions';
import CreateCouponForm from '@/app/admin/components/CreateCouponForm';
import { Ticket, Calendar, DollarSign, ShoppingBag, Layers, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  await connectDB();
  const coupons = await getCoupons();
  const categories = await getTopCategories(); 

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-8 pt-24 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Promotion Engine</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Active Coupons</h1>
          </div>
          <div className="mt-4 md:mt-0 text-right">
             <p className="text-gray-500 text-sm">Manage dynamic discounts and rules.</p>
          </div>
        </div>

        {/* CREATE SECTION */}
        <CreateCouponForm categories={categories} />

        {/* COUPON GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {coupons.map((coupon) => (
            <div key={coupon._id} className="group relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden">
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <div className="inline-block bg-black text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest shadow-md">
                    {coupon.code}
                  </div>
                  <p className="text-gray-500 text-xs mt-2 font-medium">{coupon.description}</p>
                </div>
                <div className="text-right">
                  <span className="block text-3xl font-bodoni text-[#D4AF37]">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Discount</span>
                </div>
              </div>

              {/* Rules Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-500 border-t border-gray-50 pt-4 mb-6">
                <div className="flex items-center gap-2">
                   <DollarSign size={14} className="text-[#D4AF37]" />
                   <span>Min Spend: <b className="text-black">৳{coupon.minSpend.toLocaleString()}</b></span>
                </div>
                <div className="flex items-center gap-2">
                   <ShoppingBag size={14} className="text-[#D4AF37]" />
                   <span>Min Qty: <b className="text-black">{coupon.minQuantity} Items</b></span>
                </div>
                <div className="flex items-center gap-2">
                   <Calendar size={14} className="text-[#D4AF37]" />
                   <span>Exp: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Layers size={14} className="text-[#D4AF37]" />
                   <span>Scope: <b className="text-black">{coupon.applicableCategories?.length > 0 ? 'Specific' : 'Global'}</b></span>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="mb-6">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">
                    <span>Usage</span>
                    <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                 </div>
                 <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D4AF37]" 
                      style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }} 
                    />
                 </div>
              </div>

              {/* Actions */}
              <form action={deleteCoupon.bind(null, coupon._id)}>
                <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Deactivate
                </button>
              </form>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}