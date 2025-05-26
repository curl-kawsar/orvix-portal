"use client";
import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Hourglass,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateString);
}

// Stat card component for better reusability
function StatCard({ icon, title, value, linkText, linkHref, trend, color = "blue" }) {
  const colorClasses = {
    blue: {
      icon: "bg-blue-100 text-blue-600",
      trend: "text-blue-600",
      link: "text-blue-600 hover:text-blue-700"
    },
    green: {
      icon: "bg-green-100 text-green-600",
      trend: "text-green-600",
      link: "text-green-600 hover:text-green-700"
    },
    purple: {
      icon: "bg-purple-100 text-purple-600", 
      trend: "text-purple-600",
      link: "text-purple-600 hover:text-purple-700"
    },
    amber: {
      icon: "bg-amber-100 text-amber-600",
      trend: "text-amber-600",
      link: "text-amber-600 hover:text-amber-700"
    }
  };
  
  const classes = colorClasses[color] || colorClasses.blue;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-xl ${classes.icon}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-center text-sm ${classes.trend}`}>
                    <TrendingUp className="self-center flex-shrink-0 h-4 w-4 mr-0.5" />
                    <span className="sr-only">Increased by</span>
                    {trend}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <div className="text-sm">
          <Link href={linkHref} className={`font-medium flex items-center ${classes.link}`}>
            {linkText}
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  async function fetchDashboardData(skipCache = false) {
    try {
      skipCache ? setIsRefreshing(true) : setIsLoading(true);
      
      // Build URL with potential skipCache parameter
      const url = skipCache 
        ? '/api/dashboard?skipCache=true' 
        : '/api/dashboard';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      
      if (skipCache) {
        toast.success("Dashboard data refreshed successfully");
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }
  
  // Function to handle the refresh button click
  const handleRefresh = async () => {
    try {
      // Call the cache clear API endpoint
      const clearResponse = await fetch('/api/cache/clear', {
        method: 'POST',
      });
      
      if (!clearResponse.ok) {
        const errorData = await clearResponse.json();
        throw new Error(errorData.message || 'Failed to clear cache');
      }
      
      // Fetch fresh data
      await fetchDashboardData(true);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error('Failed to refresh data');
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
            <div className="absolute top-0 left-0 h-16 w-16 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <span className="text-base font-medium text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (!dashboardData) {
    return null;
  }

  const { projects, tasks, revenue, team, upcomingDeadlines, recentActivities } = dashboardData;
  
  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Orvix 360</h1>
          <p className="mt-2 text-lg text-gray-600">
            Here's an overview of your projects and performance
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </>
          )}
        </button>
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Briefcase className="h-6 w-6" />} 
          title="Active Projects" 
          value={`${projects.active} / ${projects.total}`} 
          linkText="View all projects" 
          linkHref="/dashboard/projects"
          trend="+12.5%"
          color="blue"
        />
        
        <StatCard 
          icon={<CheckCircle className="h-6 w-6" />} 
          title="Tasks In Progress" 
          value={`${tasks.inProgress} / ${tasks.total}`} 
          linkText="View all tasks" 
          linkHref="/dashboard/tasks"
          color="purple"
        />
        
        <StatCard 
          icon={<DollarSign className="h-6 w-6" />} 
          title="Monthly Revenue" 
          value={formatCurrency(revenue.thisMonth)} 
          linkText="View financial details" 
          linkHref="/dashboard/finance"
          trend="+8.2%"
          color="green"
        />
        
        <StatCard 
          icon={<Users className="h-6 w-6" />} 
          title="Team Utilization" 
          value={`${team.utilization}%`} 
          linkText="View team details" 
          linkHref="/dashboard/team"
          color="amber"
        />
      </div>

      {/* Upcoming Deadlines and Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white shadow-sm rounded-xl border border-gray-100"
        >
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Hourglass className="h-5 w-5 mr-2 text-amber-500" />
              Upcoming Deadlines
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline, index) => (
                <motion.li 
                  key={deadline.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{deadline.name}</p>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                          deadline.status === 'in-progress' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : deadline.status === 'review'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {deadline.status.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {deadline.client}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <AlertCircle className={`flex-shrink-0 mr-1.5 h-4 w-4 ${
                          new Date(deadline.deadline) < new Date() ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        {formatDate(deadline.deadline)}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))
            ) : (
              <li className="px-6 py-8 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center">
                  <Hourglass className="h-8 w-8 text-gray-300 mb-2" />
                  <p>No upcoming deadlines</p>
                </div>
              </li>
            )}
          </ul>
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100">
            <Link href="/dashboard/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
              View all projects
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white shadow-sm rounded-xl border border-gray-100"
        >
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activities
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <motion.li 
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="px-6 py-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white">
                        <span className="text-sm font-medium">
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(activity.time)}</p>
                    </div>
                  </div>
                </motion.li>
              ))
            ) : (
              <li className="px-6 py-8 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-gray-300 mb-2" />
                  <p>No recent activities</p>
                </div>
              </li>
            )}
          </ul>
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100">
            <Link href="/dashboard/activity" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
              View all activity
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 