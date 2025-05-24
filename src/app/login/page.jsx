"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, ArrowRight, CircleUser } from "lucide-react";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen flex items-center bg-gray-50 relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-3/4 h-screen bg-gradient-to-l from-indigo-900 to-indigo-800 skew-x-[-10deg] origin-top-right"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-teal-600 rounded-tr-[100px]"></div>
        <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-yellow-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-[30%] right-[10%] w-64 h-64 bg-purple-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-[10%] right-[20%] w-24 h-24 border-4 border-white/10 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-6 z-10 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden">
          {/* Left: White Form Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 bg-white p-8 md:p-12 lg:p-16 relative z-10"
          >
            <div className="max-w-md mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                  <span className="text-white font-bold">O</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Orvix 360</h1>
              </div>
              
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
                  <p className="text-gray-600 mb-8">Sign in to access your workspace</p>
                </motion.div>
                
                <motion.form
                  className="space-y-6"
                  onSubmit={handleSubmit}
                  variants={containerVariants}
                >
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="pl-11 block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl
                          text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                          focus:ring-indigo-500 focus:border-transparent transition duration-200"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="pl-11 block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl
                          text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                          focus:ring-indigo-500 focus:border-transparent transition duration-200"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="flex items-center">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </motion.div>
                  
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3.5 px-4
                    rounded-xl text-base font-medium text-white bg-indigo-600
                    hover:bg-indigo-700 shadow-md shadow-indigo-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </motion.button>
                  
                  <motion.p
                    className="mt-6 text-center text-sm text-gray-500"
                    variants={itemVariants}
                  >
                    New to the platform?{" "}
                    <span className="font-medium text-indigo-600 hover:text-indigo-500 cursor-not-allowed">
                      Contact administrator
                    </span>
                  </motion.p>
                </motion.form>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Right: Dark Content Panel */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full lg:w-1/2 bg-indigo-900 p-12 hidden lg:flex items-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            
            <div className="relative z-10 text-white max-w-lg">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <CircleUser className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Project Lead</p>
                    <h3 className="text-white font-bold">Sarah Chen</h3>
                  </div>
                </div>
                <p className="text-white/80 italic">
                  "Orvix 360 has transformed how our team collaborates on complex projects. The integrated workflow and analytics give us the visibility we need to make informed decisions."
                </p>
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Enterprise-grade <br />project management</h2>
              <p className="text-white/80 text-lg mb-6">
                Centralize your projects, streamline workflows, and gain powerful insights with our comprehensive management solution.
              </p>
              
              <div className="flex space-x-4 mb-8">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                    <path d="M11 11h2v6h-2zm0-4h2v2h-2z"></path>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                    <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"></path>
                    <path d="M12 8c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0 6c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"></path>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 22h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2h-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1H5c-1.103 0-2 .897-2 2v15c0 1.103.897 2 2 2zM5 5h2v2h10V5h2v15H5V5z"></path>
                    <path d="m11 13.586-1.793-1.793-1.414 1.414L11 16.414l5.207-5.207-1.414-1.414z"></path>
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold text-white">JD</div>
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">KM</div>
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white">AR</div>
                </div>
                <p className="text-sm text-white/70">Join 2,000+ professionals</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 