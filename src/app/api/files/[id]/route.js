import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import File from "@/models/File";
import mongoose from "mongoose";

// Get a single file by ID
export async function GET(request, { params }) {
  try {
    // Authenticate the request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get user information
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid file ID format" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the file
    const file = await File.findById(id);
    
    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to access this file
    // Allow admins to access any file
    if (file.uploadedBy.toString() !== user.id && !file.isPublic && !isAdmin) {
      return NextResponse.json(
        { message: "You don't have permission to access this file" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ file });
  } catch (error) {
    console.error("File retrieval error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve file", error: error.message },
      { status: 500 }
    );
  }
}

// Update a file's metadata
export async function PATCH(request, { params }) {
  try {
    // Authenticate the request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get user information
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid file ID format" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the file
    const file = await File.findById(id);
    
    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this file
    // Allow admins to update any file
    if (file.uploadedBy.toString() !== user.id && !isAdmin) {
      return NextResponse.json(
        { message: "You don't have permission to update this file" },
        { status: 403 }
      );
    }
    
    // Get update data
    const body = await request.json();
    const { name, description, folder, tags, isPublic } = body;
    
    // Update the file metadata
    if (name) file.name = name;
    if (description !== undefined) file.description = description;
    if (folder) file.folder = folder;
    if (tags) file.tags = tags;
    if (isPublic !== undefined) file.isPublic = isPublic;
    
    await file.save();
    
    return NextResponse.json({ 
      message: "File updated successfully",
      file
    });
  } catch (error) {
    console.error("File update error:", error);
    return NextResponse.json(
      { message: "Failed to update file", error: error.message },
      { status: 500 }
    );
  }
}

// Delete a file
export async function DELETE(request, { params }) {
  try {
    // Authenticate the request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get user information
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid file ID format" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the file
    const file = await File.findById(id);
    
    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to delete this file
    // Allow admins to delete any file
    if (file.uploadedBy.toString() !== user.id && !isAdmin) {
      return NextResponse.json(
        { message: "You don't have permission to delete this file" },
        { status: 403 }
      );
    }
    
    // Delete from Cloudinary
    await deleteFromCloudinary(file.publicId);
    
    // Delete from database
    await File.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: "File deleted successfully" 
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete file", error: error.message },
      { status: 500 }
    );
  }
} 