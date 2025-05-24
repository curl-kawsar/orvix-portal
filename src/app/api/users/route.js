import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";

// Get all users with filtering
export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .sort({ name: 1 });
    
    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      title: user.title,
      department: user.department,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      skillsCount: user.skills?.length || 0,
      projectsCount: user.projects?.length || 0
    }));
    
    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users", error: error.message },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    if (auth.user.role !== 'admin' && auth.user.role !== 'manager') {
      return NextResponse.json(
        { message: "Unauthorized. Only admins and managers can create users." },
        { status: 403 }
      );
    }
    
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name || !userData.email || (!userData.password && !userData.generatePassword)) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check for duplicate email
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 400 }
      );
    }
    
    // Generate a random password if requested
    if (userData.generatePassword) {
      userData.password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    }
    
    // Create user
    const newUser = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password || Math.random().toString(36).slice(-16), // Default password if not provided
      phone: userData.phone,
      title: userData.title,
      department: userData.department,
      role: userData.role || 'developer',
      bio: userData.bio,
      skills: userData.skills || [],
      status: userData.status || 'active',
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: {
          ...userResponse,
          id: userResponse._id
        },
        // Only return temporary password if it was generated
        ...(userData.generatePassword ? { temporaryPassword: userData.password } : {})
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user", error: error.message },
      { status: 500 }
    );
  }
} 