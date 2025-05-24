"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",  // Include credentials to ensure cookies are sent
        });

        if (!response.ok) {
          throw new Error("Logout failed");
        }

        // Clear any auth-related data from localStorage if it exists
        localStorage.removeItem("user");
        
        toast.success("Logged out successfully");
        
        // Force a window location change rather than Next.js router
        // This ensures a full page reload and proper cookie clearing
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Error during logout");
        window.location.href = "/login";
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Logging out...</h2>
        <p className="mt-2 text-gray-600">Please wait while we log you out.</p>
        {isLoggingOut && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
} 