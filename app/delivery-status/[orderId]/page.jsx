import { getOrderStatus } from '@/actions/steadfast';
import DeliveryStatusPageClient from './DeliveryStatusPageClient';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return { title: `Order ${orderId} · Delivery Status — Oura Lifestyle` };
}

export default async function DeliveryStatusOrderPage({ params }) {
  const { orderId } = await params;

  await connectDB();
  const [order, siteContent] = await Promise.all([
    getOrderStatus(orderId),
    SiteContent.findOne({ identifier: 'main_layout' }).lean(),
  ]);

  const navData = {
    logoImage: '/logo.png',
    logoText: 'OURA',
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : [],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar navData={navData} />
      {order ? (
        <DeliveryStatusPageClient initialOrder={order} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <span className="text-2xl">📦</span>
          </div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight mb-2">Order Not Found</h1>
          <p className="text-sm text-white/40 mb-8">No order found for <span className="font-mono text-white/60">{orderId}</span></p>
          <Link
            href="/delivery-status"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-colors rounded-xl"
          >
            View All Orders
          </Link>
        </div>
      )}
    </div>
  );
}
