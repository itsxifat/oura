import connectDB from '@/lib/db';
import { getCoupons, deleteCoupon } from '@/app/actions';
import CreateCouponForm from '@/app/admin/components/CreateCouponForm';
import { AdminPageHeader } from '@/app/admin/components/AdminUI';
import { Ticket, Calendar, DollarSign, ShoppingBag, Layers, Trash2, Percent } from 'lucide-react';

export const dynamic = 'force-dynamic';

const Taka = ({ size = 12 }) => (
  <svg width={size} height={size + 2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
    className="inline-block align-middle" style={{ transform: 'translateY(-1px)' }}>
    <text x="50%" y="57%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold"
      fill="currentColor" style={{ fontFamily: 'var(--font-heading)' }}>৳</text>
  </svg>
);

function CouponCard({ coupon }) {
  const usePct = coupon.usageLimit > 0 ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100) : 0;
  const expired = new Date(coupon.validUntil) < new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#800000]/30 transition-all duration-300 overflow-hidden flex flex-col group">

      {/* Top accent */}
      <div className="h-1 bg-linear-to-r from-[#800000] to-[#800000]/30"/>

      <div className="p-5 flex-1 flex flex-col">

        {/* Header row */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <div className="inline-flex items-center gap-1.5 bg-[#800000] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm shadow-[#800000]/20 mb-2">
              <Ticket size={10}/> {coupon.code}
            </div>
            {coupon.isAutomatic && (
              <span className="ml-2 inline-flex items-center text-[9px] font-black uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Auto</span>
            )}
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5em]">
              {coupon.description || 'No description'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-3xl font-bodoni text-black leading-none">
              {coupon.discountType === 'percentage'
                ? `${coupon.discountValue}%`
                : <><Taka size={22}/>{coupon.discountValue}</>
              }
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1 inline-block">
              {coupon.discountType === 'percentage' ? 'OFF' : 'FLAT OFF'}
            </span>
          </div>
        </div>

        {/* Rules grid */}
        <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-gray-100 pt-4 mb-4 flex-1">
          {[
            { icon: DollarSign, label: 'Min Spend',  value: <><Taka size={9}/>{(coupon.minSpend ?? 0).toLocaleString()}</> },
            { icon: ShoppingBag, label: 'Min Qty',   value: `${coupon.minQuantity} items` },
            { icon: Calendar,   label: 'Expires',    value: new Date(coupon.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
            { icon: Layers,     label: 'Scope',      value: coupon.applicableCategories?.length > 0 ? 'Specific' : 'Global' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[#800000] shrink-0">
                <Icon size={11}/>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</p>
                <p className="font-bold text-gray-900 text-[10px]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Usage bar */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 mb-4">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
            <span>Redemptions</span>
            <span className="text-gray-800">{coupon.usedCount} / {coupon.usageLimit}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usePct >= 90 ? 'bg-red-500' : usePct >= 60 ? 'bg-amber-500' : 'bg-[#800000]'}`}
              style={{ width: `${usePct}%` }}
            />
          </div>
        </div>

        {/* Status + delete */}
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border
            ${expired ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {expired ? 'Expired' : 'Active'}
          </span>
          <form action={deleteCoupon.bind(null, coupon._id)}>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
              <Trash2 size={12}/> Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default async function AdminCouponsPage() {
  await connectDB();
  const coupons = await getCoupons();

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      <AdminPageHeader eyebrow="Promotion Engine" title="Coupons" count={coupons.length} countLabel="active coupons"/>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Create form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#800000]/10 flex items-center justify-center text-[#800000]">
              <Percent size={16}/>
            </div>
            <div>
              <h2 className="font-bodoni text-lg text-black">Create Coupon</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configure discount rules and eligibility</p>
            </div>
          </div>
          <CreateCouponForm/>
        </div>

        {/* Coupon grid */}
        {coupons.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-4">
              <Ticket size={24} className="text-gray-200"/>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No active promotions</p>
            <p className="text-xs text-gray-300 mt-1">Create a coupon above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {coupons.map(coupon => <CouponCard key={coupon._id} coupon={coupon}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
