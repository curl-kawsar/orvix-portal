"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Menu, 
  X, 
  Search, 
  MessageSquare, 
  UserCircle,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Briefcase,
  ClipboardList,
  FileText,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for search suggestions
const searchSuggestions = [
  { 
    id: 1, 
    title: 'Website Redesign',
    category: 'Project',
    url: '/dashboard/projects/1',
    icon: <Briefcase className="h-4 w-4 text-blue-600" />
  },
  { 
    id: 2, 
    title: 'Update Homepage Banner',
    category: 'Task',
    url: '/dashboard/tasks/2',
    icon: <ClipboardList className="h-4 w-4 text-purple-600" /> 
  },
  { 
    id: 3, 
    title: 'Acme Corporation',
    category: 'Client',
    url: '/dashboard/clients/3',
    icon: <UserCircle className="h-4 w-4 text-green-600" />
  },
  {
    id: 4,
    title: 'Project Requirements',
    category: 'Document',
    url: '/dashboard/documents/4',
    icon: <FileText className="h-4 w-4 text-amber-600" />
  },
  { 
    id: 5, 
    title: 'Mobile App Development',
    category: 'Project',
    url: '/dashboard/projects/5',
    icon: <Briefcase className="h-4 w-4 text-blue-600" /> 
  },
  { 
    id: 6, 
    title: 'Marketing Campaign',
    category: 'Project',
    url: '/dashboard/projects/6',
    icon: <Briefcase className="h-4 w-4 text-blue-600" /> 
  }
];

export default function TopNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: "New task assigned",
      message: "You have been assigned a new task: UI Design for Client X",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Meeting reminder",
      message: "Team standup in 15 minutes",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 3,
      title: "Project deadline updated",
      message: "The deadline for Project Y has been extended by 2 days",
      time: "1 hour ago",
      read: true,
    },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -5, 
      scale: 0.95,
      transition: { 
        duration: 0.15,
        ease: "easeIn" 
      } 
    }
  };
  
  // Filter suggestions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const filtered = searchSuggestions.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveSuggestionIndex(0);
  }, [searchTerm]);
  
  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if ((searchRef.current && !searchRef.current.contains(event.target)) && 
          (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target))) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to search results page with the query
      router.push(`/dashboard/search?q=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };
  
  const handleKeyDown = (e) => {
    // Down arrow
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeSuggestionIndex < filteredSuggestions.length - 1) {
        setActiveSuggestionIndex(activeSuggestionIndex + 1);
      }
    }
    // Up arrow
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeSuggestionIndex > 0) {
        setActiveSuggestionIndex(activeSuggestionIndex - 1);
      }
    }
    // Enter
    else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        const selectedSuggestion = filteredSuggestions[activeSuggestionIndex];
        router.push(selectedSuggestion.url);
        setShowSuggestions(false);
        setSearchTerm("");
      }
    }
    // Escape
    else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (url) => {
    router.push(url);
    setShowSuggestions(false);
    setSearchTerm("");
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="pl-4 pr-4 md:pl-[calc(16rem+1.5rem)] mx-auto sm:pr-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 hidden md:flex justify-start px-2" ref={searchRef}>
            <div className="w-full max-w-lg relative">
              <form onSubmit={handleSearch} className="relative text-gray-400 focus-within:text-gray-600">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  className="block w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:placeholder-gray-400 transition duration-150"
                  placeholder="Search for projects, tasks, clients..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchTerm && filteredSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  aria-expanded={showSuggestions}
                  aria-autocomplete="list"
                  aria-controls="search-suggestions"
                />
                <button type="submit" className="sr-only">Search</button>
              </form>
              
              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    id="search-suggestions"
                    className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="max-h-60 overflow-y-auto py-2">
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
                      </div>
                      <ul>
                        {filteredSuggestions.map((item, index) => (
                          <li key={item.id}>
                            <button
                              className={`flex items-center px-3 py-2 w-full text-left ${
                                index === activeSuggestionIndex 
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleSuggestionClick(item.url)}
                              onMouseEnter={() => setActiveSuggestionIndex(index)}
                            >
                              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-100 rounded-md mr-3">
                                {item.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {item.category}
                                </p>
                              </div>
                              <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="px-3 py-2 border-t border-gray-100">
                        <button 
                          onClick={handleSearch}
                          className="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center"
                        >
                          View all results
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Messages */}
            <Link href="/dashboard/messages" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-150">
              <span className="sr-only">Messages</span>
              <MessageSquare className="h-5 w-5" />
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-150 relative"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
                  if (showSuggestions) setShowSuggestions(false);
                }}
              >
                <span className="sr-only">Notifications</span>
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    className="origin-top-right absolute right-0 mt-3 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      </div>
                      {notifications.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`px-4 py-3 hover:bg-gray-50 transition ${
                                !notification.read ? "bg-blue-50" : ""
                              }`}
                              role="menuitem"
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                  <Bell className="h-4 w-4 text-white" />
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-sm text-gray-600">{notification.message}</p>
                                  <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center" role="menuitem">
                          <p className="text-sm text-gray-500">No new notifications</p>
                        </div>
                      )}
                      <div className="border-t border-gray-100">
                        <Link
                          href="/dashboard/notifications"
                          className="block w-full text-center px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 transition duration-150"
                          role="menuitem"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown */}
            <div className="relative ml-2">
              <button
                type="button"
                className="flex items-center bg-white space-x-2 rounded-lg hover:bg-gray-50 p-1.5 transition duration-150"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  if (isNotificationsOpen) setIsNotificationsOpen(false);
                  if (showSuggestions) setShowSuggestions(false);
                }}
              >
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <span className="hidden md:flex ml-2 text-sm font-medium text-gray-700">{user?.name || "User"}</span>
                  <ChevronDown className="hidden md:flex ml-1 h-4 w-4 text-gray-400" />
                </div>
              </button>

              {/* Profile dropdown panel */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div 
                    className="origin-top-right absolute right-0 mt-3 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition duration-150 flex items-center"
                      role="menuitem"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500" />
                      Your Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition duration-150 flex items-center"
                      role="menuitem"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition duration-150 flex items-center"
                      role="menuitem"
                    >
                      <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden border-t border-gray-100"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile search */}
            <div className="px-4 py-3" ref={mobileSearchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Search..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchTerm && filteredSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button type="submit" className="sr-only">Search</button>
              </form>
              
              {/* Mobile Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    className="mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden absolute left-4 right-4 z-10"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="max-h-60 overflow-y-auto py-1">
                      {filteredSuggestions.map((item, index) => (
                        <button
                          key={item.id}
                          className={`flex items-center px-4 py-2.5 w-full text-left ${
                            index === activeSuggestionIndex 
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSuggestionClick(item.url)}
                        >
                          <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.category}
                            </p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 px-4 py-2">
                        <button 
                          onClick={handleSearch}
                          className="w-full text-sm font-medium text-blue-600 hover:text-blue-500 py-1 flex justify-center items-center"
                        >
                          View all results
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition duration-150"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/projects"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150"
              >
                Projects
              </Link>
              <Link
                href="/dashboard/tasks"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150"
              >
                Tasks
              </Link>
              <Link
                href="/dashboard/team"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150"
              >
                Team
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5 py-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    <UserCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name || "User"}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email || "user@example.com"}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  href="/dashboard/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150"
                >
                  Your Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 transition duration-150"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 