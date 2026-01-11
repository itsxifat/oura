import { getTopCategories } from '@/app/actions';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AllCategoriesPage() {
  await connectDB();

  // 1. Fetch Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  const categories = await getTopCategories();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#B91C1C] selection:text-white">
      <Navbar navData={navData} />

      <main className="pt-5 md:pt-5 pb-24 px-4 md:px-6 2xl:px-12 max-w-[1920px] mx-auto">

        {/* --- PREMIUM HEADER --- */}
        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
          <h1 className="font-heading font-black text-5xl md:text-7xl 2xl:text-8xl text-black mb-6 uppercase tracking-tighter leading-none">
            The <span className="text-transparent bg-clip-text bg-gradient-to-br from-neutral-500 to-black">Collections</span>
          </h1>
          <div className="w-16 h-[3px] bg-[#B91C1C] mx-auto mb-6"></div>
          <p className="text-neutral-500 text-[10px] md:text-xs 2xl:text-sm uppercase tracking-[0.25em] font-bold">
            Curated luxury for the modern aesthetic
          </p>
        </div>

        {/* --- CATEGORIES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="group relative block w-full aspect-[3/4] overflow-hidden bg-neutral-900"
            >
              {/* IMAGE */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110 will-change-transform opacity-90 group-hover:opacity-100"
                  quality={85}
                  priority={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700">
                   <span className="font-heading text-4xl font-black">OURA</span>
                </div>
              )}

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

              {/* TEXT CONTENT */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-10">
                
                <h2 className="font-heading font-black text-3xl md:text-4xl 2xl:text-5xl text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  {cat.name}
                </h2>

                {/* Animated Red Line */}
                <div className="h-[3px] bg-[#B91C1C] w-8 group-hover:w-16 transition-all duration-500 ease-out mb-2"></div>
                
                <div className="overflow-hidden h-0 group-hover:h-auto transition-all duration-500">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                        Explore Collection
                    </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="h-[40vh] flex flex-col items-center justify-center text-neutral-400">
            <p className="font-heading text-3xl mb-2">COMING SOON</p>
            <p className="text-xs uppercase tracking-widest">Our collections are being curated.</p>
          </div>
        )}

      </main>
    </div>
  );
}