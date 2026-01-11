import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // 1. Await parameters (Next.js 15 requirement)
    const { id, index } = await params;

    // 2. Find product
    const product = await Product.findById(id).select('productImages');
    
    // 3. Validate image existence
    if (!product || !product.productImages || !product.productImages[index]) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const image = product.productImages[index];

    // 4. Return Binary Data
    return new NextResponse(image.data, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image Serve Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}