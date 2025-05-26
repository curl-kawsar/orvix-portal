import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Simple JWT verification for middleware
async function verifyAuthToken(token) {
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your_jwt_secret_key"
    );
    
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function middleware(request) {
  // Handle possible AWS proxy or load balancer issues
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isSecure = forwardedProto === "https" || request.url.startsWith("https://");
  const host = request.headers.get("host") || "localhost:3000";
  
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === "/login" || 
    path === "/forgot-password" || 
    path === "/reset-password" || 
    path.startsWith("/api/auth/") ||
    path === "/";

  // Get the token from the cookies
  const token = request.cookies.get("token")?.value;
  
  // For public paths
  if (isPublicPath) {
    // If user is logged in and trying to access login page, redirect to dashboard
    if (token && (path === "/login" || path === "/")) {
      try {
        const payload = await verifyAuthToken(token);
        if (payload) {
          // Create URL with the correct host
          const dashboardUrl = new URL("/dashboard", `http://${host}`);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (error) {
        // If token verification fails, continue to login page
        console.error("Token verification error:", error);
      }
    }
    // Otherwise, allow access to public paths
    return NextResponse.next();
  }
  
  // For protected paths
  
  // No token, redirect to login
  if (!token) {
    // Create URL with the correct host
    const loginUrl = new URL("/login", `http://${host}`);
    loginUrl.searchParams.set("callbackUrl", `http://${host}${request.nextUrl.pathname}`);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Verify token for protected paths
    const payload = await verifyAuthToken(token);
    if (!payload) {
      // If token is invalid, clear it and redirect to login
      const loginUrl = new URL("/login", `http://${host}`);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }
    
    // Token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);
    // If verification throws an error, redirect to login
    const loginUrl = new URL("/login", `http://${host}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }
}

// Define which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}; 