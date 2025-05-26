"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ClipboardList, 
  Calendar, 
  Clock, 
  UserCircle,
  Settings,
  FileText,
  CreditCard,
  LogOut,
  FolderOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Navigation items based on user roles
const navigationItems = {
  admin: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Projects", path: "/dashboard/projects", icon: <Briefcase size={20} /> },
    { name: "Tasks", path: "/dashboard/tasks", icon: <ClipboardList size={20} /> },
    { name: "Team", path: "/dashboard/team", icon: <Users size={20} /> },
    { name: "Clients", path: "/dashboard/clients", icon: <UserCircle size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Time Tracking", path: "/dashboard/time-tracking", icon: <Clock size={20} /> },
    { name: "Finance", path: "/dashboard/finance", icon: <CreditCard size={20} /> },
    { name: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  developer: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Projects", path: "/dashboard/projects", icon: <Briefcase size={20} /> },
    { name: "Tasks", path: "/dashboard/tasks", icon: <ClipboardList size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Time Tracking", path: "/dashboard/time-tracking", icon: <Clock size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  designer: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Projects", path: "/dashboard/projects", icon: <Briefcase size={20} /> },
    { name: "Tasks", path: "/dashboard/tasks", icon: <ClipboardList size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Time Tracking", path: "/dashboard/time-tracking", icon: <Clock size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  marketer: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Projects", path: "/dashboard/projects", icon: <Briefcase size={20} /> },
    { name: "Tasks", path: "/dashboard/tasks", icon: <ClipboardList size={20} /> },
    { name: "Clients", path: "/dashboard/clients", icon: <UserCircle size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Time Tracking", path: "/dashboard/time-tracking", icon: <Clock size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  hr: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Team", path: "/dashboard/team", icon: <Users size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  finance: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Projects", path: "/dashboard/projects", icon: <Briefcase size={20} /> },
    { name: "Clients", path: "/dashboard/clients", icon: <UserCircle size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Finance", path: "/dashboard/finance", icon: <CreditCard size={20} /> },
    { name: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  intern: [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Tasks", path: "/dashboard/tasks", icon: <ClipboardList size={20} /> },
    { name: "Files", path: "/dashboard/files", icon: <FolderOpen size={20} /> },
    { name: "Time Tracking", path: "/dashboard/time-tracking", icon: <Clock size={20} /> },
    { name: "Calendar", path: "/dashboard/calendar", icon: <Calendar size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Use user role from auth context, default to developer if not available
  const userRole = user?.role || "developer";
  
  const navItems = navigationItems[userRole] || navigationItems.developer;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20">
      <div className="flex flex-col h-full w-64 md:w-64 bg-white shadow-sm border-r border-gray-100 overflow-y-auto" style={{ width: "16rem" }}>
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">Orvix 360</span>
          </Link>
        </div>
        
        <div className="flex flex-col flex-grow py-5 px-4">
          <nav className="flex-1 space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    href={item.path}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className={`mr-3 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center bg-gray-50 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <UserCircle size={22} />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="ml-auto p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 