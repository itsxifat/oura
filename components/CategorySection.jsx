import { getTopCategories } from '@/app/actions';
import CategoryGridAnimated from './CategoryGridAnimated';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function CategorySection() {
  const allCategories = await getTopCategories();

  if (!allCategories || allCategories.length === 0) return null;

  // Logic: Send top 12 items to client. 
  // Desktop shows 8 (via CSS grid), Mobile cycles through them in batches of 4.
  const displayCategories = allCategories.slice(0, 12);
  const hasMore = allCategories.length > 0;

  return (
    <section className="py-8 md:py-12 2xl:py-20 bg-white relative font-sans border-t border-transparent selection:bg-[#B91C1C] selection:text-white">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 2xl:px-12">
        
        {/* --- HEADER --- */}
        <div className="text-center max-w-4xl mx-auto mb-8 md:mb-10 2xl:mb-16">
            <h2 className="font-heading font-black text-4xl md:text-6xl 2xl:text-7xl text-black mb-4 2xl:mb-6 uppercase tracking-tighter leading-none">
               The Collections
            </h2>
            <div className="w-12 2xl:w-20 h-[3px] bg-[#B91C1C] mx-auto mb-4 2xl:mb-6"></div>
            <p className="font-sans text-[10px] md:text-xs 2xl:text-sm text-neutral-500 uppercase tracking-[0.2em] font-bold">
               Engineered for the Modern Aesthetic
            </p>
        </div>

        {/* --- ANIMATED GRID --- */}
        <CategoryGridAnimated categories={displayCategories} />

        {/* --- VIEW ALL BUTTON (Visible on PC & Mobile) --- */}
        <div className="mt-12 md:mt-16 text-center">
            <Link 
              href="/categories" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-xs md:text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#B91C1C] transition-colors duration-500 group"
            >
               View All Categories
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
        </div>

      </div>
    </section>
  );
}