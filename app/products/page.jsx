import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { getAllProducts } from '@/app/actions';
import Navbar from '@/components/Navbar';
import ProductListing from '@/components/ProductListing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const { search } = await searchParams;
  const q = search || '';
  return {
    title: q ? `Search: "${q}" | OURA` : 'Shop All | OURA',
    description: q
      ? `Search results for "${q}" at OURA.`
      : 'Shop all premium clothing and accessories at OURA.',
  };
}

export default async function ProductsPage({ searchParams }) {
  await connectDB();

  const { search } = await searchParams;
  const initialSearch = search || '';

  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const sanitizedLinks = JSON.parse(JSON.stringify(siteContent?.navbarLinks || []));
  const navData = { logoImage: '/logo.png', logoText: 'OURA', links: sanitizedLinks };

  const products = await getAllProducts();

  return (
    <div className="bg-white min-h-screen text-black selection:bg-[#B91C1C] selection:text-white">
      <Navbar navData={navData} />
      <ProductListing initialProducts={products} initialSearch={initialSearch} />
    </div>
  );
}
