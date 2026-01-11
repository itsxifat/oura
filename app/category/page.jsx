import { getTopCategories } from '@/app/actions';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';

// Force dynamic rendering so new categories show up immediately
export const dynamic = 'force-dynamic';

export default async function AllCategoriesPage() {
  await connectDB();

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "ANAQA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  // 2. Fetch Categories
  const categories = await getTopCategories();

  return (
    <div className="min-h-screen bg-white font-manrope">
      <Navbar navData={navData} />

      {/* UPDATED: Reduced padding-top (pt-24 instead of pt-32) to fix the gap */}
      <main className="pt-10 md:pt-10 pb-24 px-4 md:px-8 max-w-[1800px] mx-auto">

        {/* Header Section */}
        <div className="text-center max-w-xl mx-auto mb-16 md:mb-20">
          <h1 className="font-bodoni text-5xl md:text-7xl text-gray-900 mb-4 leading-tight">
            <span className="italic block text-2xl md:text-3xl text-gray-400 mb-2">The</span>
            Collections
          </h1>
          <div className="w-px h-8 bg-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-900 text-[10px] md:text-xs uppercase tracking-[0.2em] leading-relaxed font-bold">
            Curated luxury for the modern wardrobe.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="group block relative w-full aspect-[3/4] overflow-hidden bg-gray-50"
            >
              {/* --- LAYER 1: The Image --- */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300">
                   <span className="font-bodoni text-2xl italic opacity-40">Anaqa</span>
                </div>
              )}

              {/* --- LAYER 2: The Overlay --- */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-700 ease-out" />

              {/* --- LAYER 3: Text Content --- */}
              <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-end text-white z-10">
                
                {/* UPDATED: Smaller font size (text-xl md:text-3xl) */}
                <h2 className="text-xl md:text-3xl font-bodoni italic leading-none mb-2 transform transition-transform duration-700 ease-out group-hover:-translate-y-2 drop-shadow-md">
                  {cat.name}
                </h2>

                {/* The "Masked" Reveal Animation */}
                <div className="overflow-hidden relative">
                     <div className="transform translate-y-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-y-0">
                        <div className="w-8 h-px bg-white/60 mb-2"></div>
                        <span className="text-[9px] font-manrope font-bold uppercase tracking-[0.25em] text-white/90 block">
                           Explore
                        </span>
                     </div>
                </div>

              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="h-[40vh] flex flex-col items-center justify-center text-gray-400">
            <p className="font-bodoni text-2xl italic mb-2">Coming Soon</p>
            <p className="text-xs uppercase tracking-widest">Our collections are being curated.</p>
          </div>
        )}

      </main>
    </div>
  );
}