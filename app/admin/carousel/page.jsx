import connectDB from '@/lib/db';
import Hero from '@/models/Hero';
import CarouselClient from './CarouselClient';

export const dynamic = 'force-dynamic';

export default async function CarouselPage() {
  await connectDB();
  const rawSlides = await Hero.find().sort({ createdAt: -1 }).lean();
  
  // FIX: Do not overwrite 'image' with null. Pass the string path.
  const slides = rawSlides.map(slide => ({
    ...slide,
    _id: slide._id.toString(),
    // We strictly convert IDs, but keep image paths as is
  }));

  return <CarouselClient slides={slides} />;
}