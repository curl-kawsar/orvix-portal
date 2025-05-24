import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNavbar from "@/components/dashboard/TopNavbar";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  
  // If no token is found, redirect to login page
  if (!token) {
    redirect("/login");
  }
  
  // Verify token
  const payload = await verifyJWT(token);
  if (!payload) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 