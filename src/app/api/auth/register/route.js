import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate, checkRole } from "@/lib/auth";

export async function POST(request) {
  try {
    // Check if the request is from an admin
    const auth = await authenticate(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Only admins can create new users
    if (!checkRole(auth.user, ["admin"])) {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, department, position } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || "developer",
      department: department || "development",
      position: position || "",
    });

    await newUser.save();

    // Return the created user (excluding password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      position: newUser.position,
    };

    return NextResponse.json(
      { message: "User created successfully", user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
} 