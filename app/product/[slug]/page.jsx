import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth"; // Needed for order count
import { authOptions } from '@/lib/auth';     // Needed for order count

// --- MODELS ---
import Product from '@/models/Product';
import SiteContent from '@/models/SiteContent';
import Order from '@/models/Order'; // Needed to count purchases
import User from '@/models/User';   // Needed to find user

// ✅ FIX 1: IMPORT REFERENCED MODELS (Mongoose needs these loaded)
import SizeGuide from '@/models/SizeGuide'; 
import Category from '@/models/Category'; 
import Tag from '@/models/Tag'; // <-- You missed this one!

// --- COMPONENTS ---
import Navbar from '@/components/Navbar';
import ProductDetails from '@/components/ProductDetails'; 
import RecommendedSection from '@/components/RecommendedSection'; 

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
  if (!product) return { title: 'Product Not Found | OURA' };

  return {
    title: `${product.name} | OURA`,
    description: product.description?.substring(0, 160),
    openGraph: { images: product.images?.[0] ? [{ url: product.images[0] }] : [] },
  };
}

export default async function ProductPage({ params }) {
  await connectDB();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // 1. Fetch Product
  const product = await Product.findOne({ slug: decodedSlug })
    .populate('category')
    .populate('sizeGuide') 
    .populate('tags') // ✅ FIX 2: POPULATE TAGS (This gets name & color)
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

  // 2. Calculate Order Count (For "You bought this X times" badge)
  let orderCount = 0;
  const session = await getServerSession(authOptions);
  
  if (session && session.user) {
    let userId = session.user.id;
    if (!userId && session.user.email) {
       const user = await User.findOne({ email: session.user.email });
       if (user) userId = user._id;
    }
    
    if (userId) {
       // Count how many times this specific product appears in the user's orders
       // We check the 'items.product' field in the Order model
       const orders = await Order.find({ 
           user: userId, 
           "items.product": product._id 
       }).select('_id'); // Optimized query
       orderCount = orders.length;
    }
  }

  // 3. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 4. Serialize Data
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <Navbar navData={navData} />
      
      {/* Main Component */}
      <ProductDetails 
         product={serializedProduct} 
         orderCount={orderCount} // ✅ Pass the calculated count
      />

      {/* Recommendations */}
      <div className="border-t border-gray-200">
        <RecommendedSection currentProductId={serializedProduct._id} categoryId={serializedProduct.category?._id} />
      </div>
    </div>
  );
}