import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { decryptBuffer } from "@/lib/encryption";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    console.log(`>>> API DEBUG: Requesting avatar for ID: ${id}`);

    const user = await User.findById(id).select('profilePicture');

    if (!user) {
      console.log(">>> API DEBUG: User not found in DB");
      return new NextResponse("User not found", { status: 404 });
    }

    if (!user.profilePicture || !user.profilePicture.data) {
      console.log(">>> API DEBUG: No profilePicture data on user document");
      return new NextResponse("Image data missing", { status: 404 });
    }

    console.log(">>> API DEBUG: Data found. Decrypting...");

    const decryptedImage = decryptBuffer(
      user.profilePicture.data, 
      user.profilePicture.iv
    );

    console.log(`>>> API DEBUG: Decrypted. Size: ${decryptedImage.length} bytes`);

    return new NextResponse(decryptedImage, {
      headers: {
        "Content-Type": user.profilePicture.contentType || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(">>> API DEBUG ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}