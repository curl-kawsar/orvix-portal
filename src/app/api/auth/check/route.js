import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    // Check if token exists
    if (!token) {
      return NextResponse.json({
        status: "unauthenticated",
        message: "No token found"
      }, { status: 200 });
    }

    // Verify token
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json({
        status: "unauthenticated",
        message: "Invalid token"
      }, { status: 200 });
    }

    // Connect to database
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(payload.id).select("-password");
    
    if (!user) {
      return NextResponse.json({
        status: "unauthenticated",
        message: "User not found"
      }, { status: 200 });
    }

    // User is authenticated, return user data
    return NextResponse.json({
      status: "authenticated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        department: user.department || null
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
} 