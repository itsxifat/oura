import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Navbar from '@/components/Navbar';
import ProductDetails from '@/components/ProductDetails'; 
import RecommendedSection from '@/components/RecommendedSection'; 
import SiteContent from '@/models/SiteContent';

// --- FIX: IMPORT REFERENCED MODELS ---
// Even if you don't use them directly, Mongoose needs them loaded to populate
import SizeGuide from '@/models/SizeGuide'; 
import Category from '@/models/Category'; 

// Force dynamic rendering to handle inventory updates instantly
export const dynamic = 'force-dynamic';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function generateMetadata({ params }) {
  await connectDB();
  const { slug } = await params; 
  const product = await Product.findOne({ slug: decodeURIComponent(slug) }).select('name description images');
  if (!product) return { title: 'Product Not Found | ANAQA' };

  return {
    title: `${product.name} | ANAQA`,
    description: product.description?.substring(0, 160),
    openGraph: { images: product.images?.[0] ? [{ url: product.images[0] }] : [] },
  };
}

export default async function ProductPage({ params }) {
  await connectDB();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // 1. Fetch Product
  // Because we imported SizeGuide and Category above, .populate() will now work
  const product = await Product.findOne({ slug: decodedSlug })
    .populate('category')
    .populate('sizeGuide') 
    .lean();

  if (!product) {
    // Custom 404 UI
    const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar navData={{ logoImage: "/logo.png", links: siteContent?.navbarLinks || [] }} />
        <div className="h-[60vh] flex flex-col items-center justify-center">
          <h1 className="font-bodoni text-3xl mb-2">Product Unavailable</h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-4">The item you are looking for does not exist.</p>
          <a href="/products" className="border-b border-black text-xs uppercase tracking-widest pb-1 hover:text-[#D4AF37]">Return to Shop</a>
        </div>
      </div>
    );
  }

  // 2. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "ANAQA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 3. Serialize Data
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      
      {/* Main Component */}
      <ProductDetails product={serializedProduct} />

      {/* Recommendations */}
      <div className="border-t border-gray-200">
        <RecommendedSection currentProductId={serializedProduct._id} categoryId={serializedProduct.category?._id} />
      </div>
    </div>
  );
}