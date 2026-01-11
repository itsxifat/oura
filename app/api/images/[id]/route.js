import connectDB from '@/lib/db';
import Hero from '@/models/Hero';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'mobile' or null

  try {
    await connectDB();
    const slide = await Hero.findById(id);

    if (!slide) return new NextResponse('Not found', { status: 404 });

    // Determine which image to serve
    let imgData = slide.image; // Default to desktop
    if (type === 'mobile' && slide.mobileImage && slide.mobileImage.data) {
      imgData = slide.mobileImage;
    }

    if (!imgData || !imgData.data) {
      // Fallback to desktop if mobile requested but missing
      imgData = slide.image; 
    }

    if (!imgData || !imgData.data) {
      return new NextResponse('Image data missing', { status: 404 });
    }

    return new NextResponse(imgData.data, {
      headers: {
        'Content-Type': imgData.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}