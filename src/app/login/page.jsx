"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      toast.success("Login successful!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left panel - Decorative */}
      <div className="hidden sm:flex sm:w-1/2 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <h1 className="text-4xl font-bold text-white mb-6">Orvix 360</h1>
          <p className="text-blue-100 text-xl max-w-md">
            Streamline your project management with our comprehensive platform.
          </p>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-xl"></div>
          <div className="absolute bottom-40 right-20 w-80 h-80 bg-indigo-300 rounded-full mix-blend-overlay filter blur-xl"></div>
          <div className="absolute top-1/2 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-overlay filter blur-xl"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-blue-100 text-sm z-10"
        >
          &copy; {new Date().getFullYear()} Orvix 360
        </motion.div>
      </div>
      
      {/* Right panel - Login Form */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center p-8 sm:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile logo only */}
          <div className="sm:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-blue-600">Orvix 360</h1>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600 mb-8">Please sign in to your account</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg 
                  placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg 
                  placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-150 ease-in-out"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent 
              rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <span className="font-medium text-blue-600 hover:text-blue-500 cursor-not-allowed">
              Contact administrator
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 