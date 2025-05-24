import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from 'mongoose';
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    // Check if token exists
    if (!token) {
      return NextResponse.json({
        status: "unauthenticated",
        reason: "No token found in cookies"
      }, { status: 200 }); // Return 200 for diagnostic purposes
    }

    // Verify token without connecting to database
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json({
        status: "invalid_token",
        reason: "Token verification failed",
        tokenExists: true,
        tokenLength: token.length
      }, { status: 200 });
    }

    // Token is valid
    const diagnosticInfo = {
      status: "token_verified",
      payload: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat
      },
      mongoStatus: {
        initialized: !!mongoose.connection,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'not connected'
      }
    };

    try {
      // Connect to database
      await connectToDatabase();
      
      diagnosticInfo.mongoStatus = {
        ...diagnosticInfo.mongoStatus,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'not connected',
        dbName: mongoose.connection.db?.databaseName || 'unknown'
      };

      try {
        // Try to find the user
        const user = await User.findById(payload.id).select("-password");
        
        if (!user) {
          return NextResponse.json({
            ...diagnosticInfo,
            status: "user_not_found",
            reason: `User with ID ${payload.id} not found in database`,
            databaseConnected: true
          }, { status: 200 });
        }

        // Success - user found
        return NextResponse.json({
          ...diagnosticInfo,
          status: "authenticated",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }, { status: 200 });
      } catch (userError) {
        return NextResponse.json({
          ...diagnosticInfo,
          status: "user_lookup_failed",
          reason: "Error finding user in database",
          error: userError.message,
          errorStack: userError.stack
        }, { status: 200 });
      }
    } catch (dbError) {
      return NextResponse.json({
        ...diagnosticInfo,
        status: "database_error",
        reason: "Database connection failed",
        error: dbError.message,
        errorStack: dbError.stack,
        mongoURI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set'
      }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({
      status: "error",
      reason: "Unexpected error during authentication check",
      error: error.message,
      errorStack: error.stack
    }, { status: 200 });
  }
} 