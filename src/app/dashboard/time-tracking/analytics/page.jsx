"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Clock,
  Calendar,
  BarChart2,
  Download,
  Filter,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, formatISO, parseISO } from "date-fns";

export default function TimeTrackingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState({
    period: "week",
    project: "all"
  });
  
  // Colors for charts
  const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", 
    "#eab308", "#84cc16", "#10b981", "#06b6d4", "#3b82f6"
  ];

  // Fetch time entries and projects on page load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch time entries
        const entriesResponse = await fetch(`/api/time-entries?period=${filter.period}`);
        if (!entriesResponse.ok) throw new Error('Failed to fetch time entries');
        const entriesData = await entriesResponse.json();
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects?fields=name,_id,color');
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsResponse.json();
        
        setTimeEntries(entriesData.entries || []);
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filter.period]);

  // Format time from seconds to hours
  const formatTimeHours = (seconds) => {
    return (seconds / 3600).toFixed(1);
  };

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare data for daily chart
  const dailyData = (() => {
    // Determine date range based on selected period
    const now = new Date();
    let start, end;
    
    if (filter.period === "week") {
      start = startOfWeek(now);
      end = endOfWeek(now);
    } else {
      start = startOfMonth(now);
      end = endOfMonth(now);
    }
    
    const days = eachDayOfInterval({ start, end });
    
    // Initialize data with all days
    const data = days.map(day => ({
      date: format(day, 'MMM dd'),
      hours: 0,
      seconds: 0
    }));
    
    // Aggregate time entries by day
    timeEntries.forEach(entry => {
      const entryDate = parseISO(entry.startTime);
      const dayIndex = days.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(entryDate, 'yyyy-MM-dd')
      );
      
      if (dayIndex !== -1) {
        data[dayIndex].seconds += entry.duration;
        data[dayIndex].hours = parseFloat(formatTimeHours(data[dayIndex].seconds));
      }
    });
    
    return data;
  })();

  // Prepare data for project distribution chart
  const projectData = (() => {
    // Group time entries by project
    const projectTotals = {};
    
    timeEntries.forEach(entry => {
      if (entry.projectId) {
        if (!projectTotals[entry.projectId]) {
          projectTotals[entry.projectId] = 0;
        }
        projectTotals[entry.projectId] += entry.duration;
      } else {
        if (!projectTotals['unassigned']) {
          projectTotals['unassigned'] = 0;
        }
        projectTotals['unassigned'] += entry.duration;
      }
    });
    
    // Convert to array for chart
    return Object.entries(projectTotals).map(([projectId, seconds]) => {
      const project = projects.find(p => p._id === projectId);
      return {
        name: project ? project.name : 'Unassigned',
        value: parseFloat(formatTimeHours(seconds)),
        seconds
      };
    }).sort((a, b) => b.value - a.value);
  })();

  // Calculate total hours
  const totalHours = timeEntries.reduce((total, entry) => total + entry.duration, 0) / 3600;
  const totalTime = formatTime(timeEntries.reduce((total, entry) => total + entry.duration, 0));
  
  // Calculate average daily hours
  const avgDailyHours = dailyData.length > 0 
    ? (timeEntries.reduce((total, entry) => total + entry.duration, 0) / 3600) / dailyData.length
    : 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/time-tracking">
            <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyze your time usage and productivity
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Time period filter */}
          <div className="relative">
            <select
              value={filter.period}
              onChange={(e) => setFilter(prev => ({ ...prev, period: e.target.value }))}
              className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {/* Export button */}
          <button
            onClick={() => toast.info("Export functionality coming soon!")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
            <Clock className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalHours.toFixed(1)}</p>
          <p className="mt-1 text-sm text-gray-500">{totalTime}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Average Daily</h3>
            <BarChart2 className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{avgDailyHours.toFixed(1)}</p>
          <p className="mt-1 text-sm text-gray-500">hours per day</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Most Active</h3>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {dailyData.length > 0 
              ? dailyData.reduce((max, day) => day.hours > max.hours ? day : max, dailyData[0]).date
              : 'N/A'
            }
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {dailyData.length > 0 
              ? `${dailyData.reduce((max, day) => day.hours > max.hours ? day : max, dailyData[0]).hours.toFixed(1)} hours`
              : 'No data available'
            }
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Hours</h3>
          
          {dailyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis 
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} hours`, 'Time']}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Project Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Distribution</h3>
          
          {projectData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}h`}
                    labelLine={false}
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} hours`, 'Time']}
                    contentStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* Project Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Project Breakdown</h3>
        </div>
        
        {projectData.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No project data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectData.map((project, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="h-3 w-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-900">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{project.value.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[200px]">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${(project.seconds / timeEntries.reduce((sum, entry) => sum + entry.duration, 0)) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length] 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {((project.seconds / timeEntries.reduce((sum, entry) => sum + entry.duration, 0)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 