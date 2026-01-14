import connectDB from '@/lib/db';
import { getCoupons, getTopCategories, deleteCoupon } from '@/app/actions';
import CreateCouponForm from '@/app/admin/components/CreateCouponForm';
import { Ticket, Calendar, DollarSign, ShoppingBag, Layers, Trash2, Percent, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

// --- TAKA SVG COMPONENT ---
const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

export default async function AdminCouponsPage() {
  await connectDB();
  const coupons = await getCoupons();
  const categories = await getTopCategories(); 

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-manrope p-4 md:p-8 pt-24 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8 gap-4">
          <div>
            <span className="text-[#800000] font-bold uppercase tracking-[0.3em] text-[10px]">Promotion Engine</span>
            <h1 className="font-bodoni text-4xl md:text-5xl mt-2 text-black">Active Coupons</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage dynamic discounts, sales rules, and promo codes.</p>
          </div>
        </div>

        {/* CREATE SECTION */}
        <div className="mb-12">
            <CreateCouponForm categories={categories} />
        </div>

        {/* COUPON GRID */}
        {coupons.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 mx-auto">
                   <Ticket size={24} className="opacity-20 text-black" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No Active Promotions</p>
                <p className="text-xs mt-1 text-gray-300">Create a new coupon to get started.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="group relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#800000]/30 transition-all duration-300 overflow-hidden flex flex-col h-full">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <div className="inline-block bg-[#800000] text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#800000]/20">
                        {coupon.code}
                      </div>
                      <p className="text-gray-500 text-xs mt-3 font-medium line-clamp-2 min-h-[2.5em]">{coupon.description}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="block text-4xl font-bodoni text-black leading-none">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : <><Taka size={24} weight="bold"/>{coupon.discountValue}</>}
                      </span>
                      <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold mt-1 bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                         {coupon.discountType === 'percentage' ? 'OFF' : 'FLAT OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Rules Grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[10px] text-gray-500 border-t border-gray-50 pt-5 mb-6 flex-1">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[#800000]"><DollarSign size={12}/></div>
                       <div className="flex flex-col">
                           <span className="uppercase tracking-wider font-bold text-gray-300">Min Spend</span>
                           <span className="text-gray-900 font-bold"><Taka size={9}/>{coupon.minSpend.toLocaleString()}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[#800000]"><ShoppingBag size={12}/></div>
                       <div className="flex flex-col">
                           <span className="uppercase tracking-wider font-bold text-gray-300">Min Qty</span>
                           <span className="text-gray-900 font-bold">{coupon.minQuantity} Items</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[#800000]"><Calendar size={12}/></div>
                       <div className="flex flex-col">
                           <span className="uppercase tracking-wider font-bold text-gray-300">Expires</span>
                           <span className="text-gray-900 font-bold">{new Date(coupon.validUntil).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[#800000]"><Layers size={12}/></div>
                       <div className="flex flex-col">
                           <span className="uppercase tracking-wider font-bold text-gray-300">Scope</span>
                           <span className="text-gray-900 font-bold">{coupon.applicableCategories?.length > 0 ? 'Specific' : 'Global'}</span>
                       </div>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <div className="flex justify-between text-[9px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                        <span>Redemptions</span>
                        <span className="text-gray-900">{coupon.usedCount} <span className="text-gray-300">/</span> {coupon.usageLimit}</span>
                     </div>
                     <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#800000] rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }} 
                        />
                     </div>
                  </div>

                  {/* Actions */}
                  <form action={deleteCoupon.bind(null, coupon._id)}>
                    <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-2 group">
                      <Trash2 size={14} className="group-hover:text-[#D4AF37] transition-colors"/> Deactivate
                    </button>
                  </form>

                </div>
              ))}
            </div>
        )}

      </div>
    </div>
  );
}