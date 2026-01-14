import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection"; 
import RecommendedSection from "../components/RecommendedSection"; // <--- THIS IS THE CORRECT IMPORT
import connectDB from "@/lib/db";
import HeroModel from "@/models/Hero";
import SiteContent from "@/models/SiteContent";

export default async function Home() {
  await connectDB();
  
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "OURA",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : [] 
  };

  const slides = await HeroModel.find({}).sort({ createdAt: -1 }).lean();
  const heroData = slides.map(slide => ({
    id: slide._id.toString(),
    link: slide.link || '/',
    imageDesktop: slide.image || '/placeholder.jpg',
    imageMobile: slide.mobileImage || null
  }));

  return (
    <main className="min-h-screen bg-white">
      <Navbar navData={navData} />
      
      {/* Hero Carousel */}
      {heroData.length > 0 ? (
        <Hero heroData={heroData} />
      ) : (
        <div className="h-[500px] flex flex-col items-center justify-center bg-gray-50 text-gray-400">
          <p className="text-sm uppercase tracking-widest">Carousel Empty</p>
        </div>
      )}

      {/* Category Section */}
      <CategorySection />

      {/* Recommendations */}
      <RecommendedSection />

    </main>
  );
}