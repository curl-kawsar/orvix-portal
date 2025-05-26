import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signJWT } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the user by email and explicitly include the password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if the password is correct
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Ensure user ID is properly formatted as a string
    const userId = user._id.toString();
    
    // Create a JWT token
    const token = await signJWT({
      id: userId,
      email: user.email,
      role: user.role,
    });

    // Set the token as a cookie
    const cookieStore = cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only set secure in production
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      sameSite: "lax" // Use lax instead of none for better compatibility
    });

    console.log(`Login successful for: ${email} with ID: ${userId}`);

    // Return user data (excluding password)
    const userResponse = {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      position: user.position,
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Authentication failed", error: error.message },
      { status: 500 }
    );
  }
} 