import { NextResponse } from "next/server";
import { generateProjectTimeline } from "@/lib/gemini-ai";
import { authenticate } from "@/lib/auth";

export async function POST(request) {
  try {
    // Check authentication
    const auth = await authenticate(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get project details from request body
    const projectDetails = await request.json();
    
    // Validate required fields
    if (!projectDetails.name || !projectDetails.description) {
      return NextResponse.json(
        { message: "Project name and description are required" },
        { status: 400 }
      );
    }
    
    // Get AI generated timeline
    const timeline = await generateProjectTimeline(projectDetails);
    
    return NextResponse.json(timeline, { status: 200 });
  } catch (error) {
    console.error("Error generating project timeline:", error);
    return NextResponse.json(
      { message: "Error generating project timeline", error: error.message },
      { status: 500 }
    );
  }
} 