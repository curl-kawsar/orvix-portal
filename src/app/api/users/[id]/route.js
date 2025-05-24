import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific user by ID
export async function GET(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const user = await User.findById(id)
      .select('-password')
      .populate('projects', 'name description status'); // Populate projects if needed
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Format user for response
    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      title: user.title,
      department: user.department,
      role: user.role,
      bio: user.bio,
      avatar: user.avatar,
      status: user.status,
      skills: user.skills,
      projects: user.projects?.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status
      })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Error fetching user", error: error.message },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    // Check permissions
    if (auth.user.role !== 'admin' && auth.user._id.toString() !== params.id && auth.user.role !== 'manager') {
      return NextResponse.json(
        { message: "Unauthorized. You can only edit your own profile or you need admin/manager permissions." },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }
    
    const userData = await request.json();
    
    await connectToDatabase();
    
    // If email is being updated, check for duplicates
    if (userData.email) {
      const existingUser = await User.findOne({ 
        email: userData.email,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { message: "A user with this email already exists" },
          { status: 400 }
        );
      }
    }
    
    // Prepare update object, removing sensitive fields if not admin
    const updateData = { ...userData };
    
    // Only admins can change roles
    if (auth.user.role !== 'admin' && updateData.role) {
      delete updateData.role;
    }
    
    // Handle password update if provided
    if (updateData.password) {
      // The password will be hashed automatically by the User model pre-save hook
      // But for findByIdAndUpdate, we need to hash it manually
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        title: updatedUser.title,
        department: updatedUser.department,
        role: updatedUser.role,
        status: updatedUser.status,
        skills: updatedUser.skills,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user", error: error.message },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    // Only admins can delete users
    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { message: "Unauthorized. Only admins can delete users." },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this is the last admin
    if (id === auth.user._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: "Cannot delete the last admin user. Create another admin first." },
          { status: 400 }
        );
      }
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "User deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Error deleting user", error: error.message },
      { status: 500 }
    );
  }
} 