import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { authenticate } from "@/lib/auth";
import File from "@/models/File";

export async function POST(request) {
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
    
    // Debug user object
    console.log("User object from auth:", JSON.stringify(user));
    
    if (!user || !user._id) {
      console.error("Missing user ID in auth response");
      return NextResponse.json(
        { message: "User authentication error" },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Get file metadata
    const name = formData.get("name") || file.name;
    const description = formData.get("description") || "";
    const folder = formData.get("folder") || "general";
    const tags = formData.get("tags") ? formData.get("tags").split(",").map(tag => tag.trim()) : [];
    const isPublic = formData.get("isPublic") === "true";

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed" },
        { status: 400 }
      );
    }
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size exceeds the limit (10MB)" },
        { status: 400 }
      );
    }

    // Upload file to Cloudinary
    const uploadOptions = {
      folder: `orvix-portal/${folder}`,
      resource_type: "auto",
      public_id: `${Date.now()}-${name.replace(/\s+/g, '-')}`,
      tags: tags
    };

    const uploadResult = await uploadToCloudinary(file, uploadOptions);

    // Connect to the database
    await connectToDatabase();

    // Determine file type category
    let fileType = "document";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
    } else if (file.type.startsWith("audio/")) {
      fileType = "audio";
    }

    // Get the user ID, ensuring it's available in the correct format
    const userId = user._id || user.id;
    console.log("Using user ID for file upload:", userId);
    
    // Create a new file record in the database
    const newFile = new File({
      name,
      description,
      fileType,
      mimeType: file.type,
      size: file.size,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      uploadedBy: userId,
      folder,
      tags,
      isPublic,
      metadata: {
        width: uploadResult.width?.toString() || "",
        height: uploadResult.height?.toString() || "",
        format: uploadResult.format || "",
        resourceType: uploadResult.resource_type || ""
      }
    });

    await newFile.save();

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        id: newFile._id,
        name: newFile.name,
        url: newFile.url,
        fileType: newFile.fileType,
        size: newFile.size,
        createdAt: newFile.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { message: "File upload failed", error: error.message },
      { status: 500 }
    );
  }
} 