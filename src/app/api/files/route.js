import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import File from "@/models/File";

export async function GET(request) {
  try {
    // Authenticate the request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    // Get the current user
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    
    // Debug user object
    console.log("Files API - User object:", JSON.stringify(user));
    
    if (!user || (!user._id && !user.id)) {
      console.error("Files API - Missing user ID in auth response");
      return NextResponse.json(
        { message: "User authentication error" },
        { status: 500 }
      );
    }
    
    // Get the user ID, ensuring it's available in the correct format
    const userId = user._id || user.id;
    console.log("Files API - Using user ID for query:", userId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const folder = searchParams.get("folder");
    const fileType = searchParams.get("fileType");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Connect to the database
    await connectToDatabase();
    
    // Build the query
    // If user is admin, don't filter by uploadedBy to see all files
    const query = isAdmin ? {} : { uploadedBy: userId };
    
    // Add folder filter if provided
    if (folder) {
      query.folder = folder;
    }
    
    // Add file type filter if provided
    if (fileType) {
      query.fileType = fileType;
    }
    
    // Add search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    console.log("Files API - Query:", JSON.stringify(query));
    console.log("Files API - User is admin:", isAdmin);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Execute the query
    let filesQuery = File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // If admin, populate the user information
    if (isAdmin) {
      filesQuery = filesQuery.populate('uploadedBy', 'name email role');
    }
    
    // Select fields and execute
    const files = await filesQuery.select("name description fileType size url createdAt folder tags isPublic uploadedBy");
    
    console.log(`Files API - Found ${files.length} files`);
    
    // Count total files for pagination
    const totalFiles = await File.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalFiles / limit);
    
    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        totalFiles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("File listing error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve files", error: error.message },
      { status: 500 }
    );
  }
} 