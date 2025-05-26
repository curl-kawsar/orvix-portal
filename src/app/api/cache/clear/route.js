import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { clearCache } from "@/lib/cache";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request) {
  try {
    // Make sure the user is authenticated and has admin privileges
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    // Only allow admins to clear cache
    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { message: "Only administrators can clear the cache" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Clear the cache
    await clearCache();
    
    return NextResponse.json({ 
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { message: "Error clearing cache", error: error.message },
      { status: 500 }
    );
  }
} 