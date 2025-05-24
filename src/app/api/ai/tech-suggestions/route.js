import { NextResponse } from "next/server";
import { getTechSuggestions } from "@/lib/gemini-ai";
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
    
    // Get project description from request body
    const { description } = await request.json();
    
    // Validate required fields
    if (!description) {
      return NextResponse.json(
        { message: "Project description is required" },
        { status: 400 }
      );
    }
    
    // Get AI tech suggestions
    const suggestions = await getTechSuggestions(description);
    
    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("Error getting AI tech suggestions:", error);
    return NextResponse.json(
      { message: "Error generating tech suggestions", error: error.message },
      { status: 500 }
    );
  }
} 