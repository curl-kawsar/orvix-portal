"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from "recharts";
import {
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Users, 
  Clock, 
  Calendar,
  Briefcase,
  DollarSign,
  Download,
  Filter,
  RefreshCcw,
  Loader2,
  ArrowDown,
  ArrowUp,
  FileText,
  Check,
  X
} from "lucide-react";

// Custom tab component
function Tab({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`mr-2 ${active ? "text-indigo-600" : "text-gray-400"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// Custom card component
function ReportCard({ title, icon, value, trend, trendValue, trendLabel, color = "indigo" }) {
  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      trend: trendValue >= 0 ? "text-green-600" : "text-red-600"
    },
    teal: {
      bg: "bg-teal-50",
      icon: "text-teal-600",
      trend: trendValue >= 0 ? "text-green-600" : "text-red-600"
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      trend: trendValue >= 0 ? "text-green-600" : "text-red-600"
    },
    violet: {
      bg: "bg-violet-50",
      icon: "text-violet-600",
      trend: trendValue >= 0 ? "text-green-600" : "text-red-600"
    }
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${classes.bg}`}>
          <span className={classes.icon}>{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trendValue !== undefined && (
              <div className={`flex items-center ml-2 text-sm ${classes.trend}`}>
                {trendValue >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="ml-1">{Math.abs(trendValue)}%</span>
              </div>
            )}
          </div>
          {trendLabel && <p className="text-xs text-gray-500 mt-1">{trendLabel}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom colors for charts
  const COLORS = ['#4f46e5', '#0891b2', '#059669', '#7c3aed', '#d97706', '#db2777'];

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports?period=${dateRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportData();
  }, [dateRange]);

  // Change date range and refresh data
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Export reports as CSV
  const handleExport = () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }
    
    toast.success('Exporting report data...');
    // Implementation would connect to API endpoint for export
    // In a real app, this would use a library like json2csv or call an API endpoint
  };

  // Handler for tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // If loading, show skeleton loader
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>

        <div className="h-80 bg-gray-200 rounded-xl animate-pulse mt-6"></div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Error loading reports</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
            >
              <RefreshCcw className="inline-block mr-1 h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no data loaded yet, show a message
  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">No report data available. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date range selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          {/* Refresh button */}
          <button
            onClick={() => {
              setIsLoading(true);
              setDateRange(dateRange);
              toast.success('Refreshing report data...');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto pb-3">
          <Tab
            active={activeTab === "overview"}
            icon={<BarChart3 size={18} />}
            label="Overview"
            onClick={() => handleTabChange("overview")}
          />
          <Tab
            active={activeTab === "projects"}
            icon={<Briefcase size={18} />}
            label="Projects"
            onClick={() => handleTabChange("projects")}
          />
          <Tab
            active={activeTab === "time"}
            icon={<Clock size={18} />}
            label="Time Tracking"
            onClick={() => handleTabChange("time")}
          />
          <Tab
            active={activeTab === "financial"}
            icon={<DollarSign size={18} />}
            label="Financial"
            onClick={() => handleTabChange("financial")}
          />
          <Tab
            active={activeTab === "team"}
            icon={<Users size={18} />}
            label="Team"
            onClick={() => handleTabChange("team")}
          />
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title="Total Projects"
              icon={<Briefcase size={20} />}
              value={reportData.overview.totalProjects}
              trendValue={reportData.overview.projectsGrowth}
              trendLabel="vs. previous period"
              color="indigo"
            />
            <ReportCard
              title="Total Hours Logged"
              icon={<Clock size={20} />}
              value={reportData.overview.totalHours}
              trendValue={reportData.overview.hoursGrowth}
              trendLabel="vs. previous period"
              color="teal"
            />
            <ReportCard
              title="Total Revenue"
              icon={<DollarSign size={20} />}
              value={reportData.overview.revenue}
              trendValue={reportData.overview.revenueGrowth}
              trendLabel="vs. previous period"
              color="amber"
            />
            <ReportCard
              title="Team Utilization"
              icon={<Users size={20} />}
              value={reportData.overview.teamUtilization}
              trendValue={reportData.overview.utilizationGrowth}
              trendLabel="vs. previous period"
              color="violet"
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Monthly Revenue</span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.monthlyRevenue}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                      labelFormatter={(value) => `Month: ${value}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Status Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Status Distribution</h3>
              </div>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.projectStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.projectStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Projects"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Time Tracking Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Time Tracking by Department</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.timeTracking}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value} hours`, "Time Spent"]} />
                  <Legend />
                  <Bar dataKey="hours" name="Hours" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.teamPerformance.map((member, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">{member.completed}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.inProgress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-indigo-600 h-2.5 rounded-full" 
                              style={{ width: `${member.efficiency}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{member.efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab Content */}
      {activeTab === "projects" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Performance</h3>
          <p className="text-gray-500">Detailed project analytics will be displayed here.</p>
        </div>
      )}

      {/* Time Tracking Tab Content */}
      {activeTab === "time" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time Tracking Analysis</h3>
          <p className="text-gray-500">Detailed time tracking analytics will be displayed here.</p>
        </div>
      )}

      {/* Financial Tab Content */}
      {activeTab === "financial" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Performance</h3>
          <p className="text-gray-500">Detailed financial analytics will be displayed here.</p>
        </div>
      )}

      {/* Team Tab Content */}
      {activeTab === "team" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
          <p className="text-gray-500">Detailed team analytics will be displayed here.</p>
        </div>
      )}
    </div>
  );
} 