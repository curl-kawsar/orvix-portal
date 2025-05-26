import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}

// Skip auth middleware
export const config = {
  middleware: false
}; 