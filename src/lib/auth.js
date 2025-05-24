import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectToDatabase } from "./mongodb";
import mongoose from 'mongoose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your_jwt_secret_key"
);

// Sign a new JWT token
export async function signJWT(payload) {
  // Ensure MongoDB ObjectId is converted to string
  const processedPayload = { ...payload };
  
  // Convert any ObjectId to string
  if (processedPayload.id) {
    if (typeof processedPayload.id === 'object' && processedPayload.id.toString) {
      processedPayload.id = processedPayload.id.toString();
    } else if (typeof processedPayload.id === 'object' && processedPayload.id._id) {
      // Handle case where id is an object with _id property
      processedPayload.id = processedPayload.id._id.toString();
    }
  }
  
  // Convert _id to id if exists
  if (processedPayload._id && !processedPayload.id) {
    if (typeof processedPayload._id === 'object' && processedPayload._id.toString) {
      processedPayload.id = processedPayload._id.toString();
    } else {
      processedPayload.id = String(processedPayload._id);
    }
  }
  
  console.log('Creating JWT with payload:', JSON.stringify(processedPayload));
  
  const token = await new SignJWT(processedPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return token;
}

// Verify a JWT token
export async function verifyJWT(token) {
  try {
    console.log("Verifying JWT token...");
    if (!token) {
      console.log("No token provided to verifyJWT");
      return null;
    }
    
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log("JWT verified successfully, payload ID:", payload.id);
      return payload;
    } catch (error) {
      console.error("JWT verification failed:", error.message);
      
      // Special handling for different JWT errors
      if (error.code === 'ERR_JWT_EXPIRED') {
        console.log("Token has expired");
      } else if (error.code === 'ERR_JWT_INVALID') {
        console.log("Token is invalid");
      } else if (error.code === 'ERR_JWT_MALFORMED') {
        console.log("Token is malformed");
      }
      
      return null;
    }
  } catch (error) {
    console.error("Unexpected error during JWT verification:", error);
    return null;
  }
}

// Check if a string is a valid MongoDB ObjectId
function isValidObjectId(id) {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
}

// Authenticate API requests
export async function authenticate(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.log("Authentication failed: Token missing");
      return { success: false, message: "Authentication token missing" };
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      console.log("Authentication failed: Invalid token");
      return { success: false, message: "Invalid token or token expired" };
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(payload.id)) {
      console.log(`Authentication failed: Invalid MongoDB ObjectId format: ${payload.id}`);
      return { 
        success: false, 
        message: "Invalid user ID format", 
        error: "The user ID in your token is not a valid MongoDB ObjectId" 
      };
    }

    try {
      await connectToDatabase();
      
      // Log the ID we're searching for to help with debugging
      console.log(`Looking for user with ID: ${payload.id}`);
      
      try {
        // Find the user by ID
        const user = await User.findById(payload.id).select("-password");
        
        if (!user) {
          console.log(`Authentication failed: User ${payload.id} not found in database`);
          return { success: false, message: "User not found in database" };
        }
        
        // Successfully authenticated
        return {
          success: true,
          user: JSON.parse(JSON.stringify(user)),
        };
      } catch (userError) {
        console.error("User lookup error:", userError);
        return { 
          success: false, 
          message: "Error finding user", 
          error: userError.message 
        };
      }
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return { 
        success: false, 
        message: "Database connection error", 
        error: dbError.message 
      };
    }
  } catch (error) {
    console.error("Unexpected authentication error:", error);
    return {
      success: false,
      message: "Authentication failed",
      error: error.message
    };
  }
}

// Middleware to protect API routes
export async function withAuth(request) {
  const auth = await authenticate(request);

  if (!auth.success) {
    return NextResponse.json(
      { message: auth.message },
      { status: 401 }
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("user", JSON.stringify(auth.user));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Get current user from request
export function getCurrentUser(request) {
  const userHeader = request.headers.get("user");
  if (!userHeader) return null;
  return JSON.parse(userHeader);
}

// Check if user has required role
export function checkRole(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
} 