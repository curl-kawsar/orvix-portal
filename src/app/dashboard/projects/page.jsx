"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  Briefcase, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  PauseCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Loader2,
  Eye,
  Edit,
  BarChart3,
  CheckSquare,
  Users,
  Sliders,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ListFilter
} from "lucide-react";
import { toast } from "sonner";

// Status badge component with enhanced design
function StatusBadge({ status }) {
  const statusConfig = {
    "planning": { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="w-3.5 h-3.5 mr-1" /> },
    "in-progress": { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Briefcase className="w-3.5 h-3.5 mr-1" /> },
    "review": { color: "bg-purple-100 text-purple-800 border-purple-200", icon: <AlertCircle className="w-3.5 h-3.5 mr-1" /> },
    "completed": { color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-3.5 h-3.5 mr-1" /> },
    "on-hold": { color: "bg-orange-100 text-orange-800 border-orange-200", icon: <PauseCircle className="w-3.5 h-3.5 mr-1" /> },
    "cancelled": { color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-3.5 h-3.5 mr-1" /> },
  };

  const config = statusConfig[status] || statusConfig["planning"];
  const displayStatus = status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`px-2.5 py-1 inline-flex items-center text-xs font-medium rounded-full border ${config.color}`}>
      {config.icon}
      {displayStatus}
    </span>
  );
}

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

// Format date with deadline highlighting
function formatDateWithHighlight(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  
  let textColor = "text-gray-700";
  if (diffDays < 0) {
    textColor = "text-red-600 font-medium";
  } else if (diffDays <= 7) {
    textColor = "text-amber-600";
  }
  
  return (
    <div className="flex flex-col">
      <span className={`text-sm ${textColor}`}>{formatDate(dateString)}</span>
      {diffDays < 0 ? (
        <span className="text-xs text-red-500 mt-0.5">Overdue</span>
      ) : diffDays <= 7 ? (
        <span className="text-xs text-amber-500 mt-0.5">{diffDays} days left</span>
      ) : null}
    </div>
  );
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("deadline");
  const [sortDirection, setSortDirection] = useState("asc");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        
        // Build query params
        const queryParams = new URLSearchParams();
        if (statusFilter) {
          queryParams.append('status', statusFilter);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        
        const response = await fetch(`/api/projects?${queryParams.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error.message);
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [searchQuery, statusFilter]);

  // Filter and sort projects
  const filteredProjects = [...projects]
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0;
      
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "client") {
        comparison = a.client.name.localeCompare(b.client.name);
      } else if (sortField === "deadline") {
        comparison = new Date(a.deadline) - new Date(b.deadline);
      } else if (sortField === "budget") {
        comparison = a.budget - b.budget;
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === "completionPercentage") {
        comparison = a.completionPercentage - b.completionPercentage;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate project statistics
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'in-progress').length,
    planning: projects.filter(p => p.status === 'planning').length,
    completed: projects.filter(p => p.status === 'completed').length,
    review: projects.filter(p => p.status === 'review').length,
    onHold: projects.filter(p => p.status === 'on-hold').length,
    overdue: projects.filter(p => new Date(p.deadline) < new Date() && p.status !== 'completed').length
  };

  // Stat card component
  const StatCard = ({ label, value, icon, color }) => (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
      <div className="p-4 flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with title and button */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your projects
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Projects" 
          value={stats.total} 
          icon={<Briefcase className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard 
          label="Active Projects" 
          value={stats.active} 
          icon={<RefreshCw className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard 
          label="In Review" 
          value={stats.review} 
          icon={<AlertCircle className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard 
          label="Overdue" 
          value={stats.overdue} 
          icon={<Clock className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Project List</h2>
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ListFilter className="w-4 h-4 mr-2 text-gray-500" />
            Filters
            {isFilterExpanded ? 
              <ChevronUp className="w-4 h-4 ml-1 text-gray-500" /> : 
              <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
            }
          </button>
        </div>

        <div className={`transition-all duration-300 ease-in-out ${isFilterExpanded ? 'max-h-80 opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">Search Projects</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Project name, client, etc."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Status filter */}
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="status"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Sort by */}
            <div>
              <label htmlFor="sortBy" className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sliders className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="sortBy"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="client">Client</option>
                    <option value="deadline">Deadline</option>
                    <option value="completionPercentage">Progress</option>
                    <option value="budget">Budget</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                >
                  {sortDirection === "asc" ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar for collapsed state */}
        {!isFilterExpanded && (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Status filter */}
            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
            <div className="absolute top-0 left-0 h-20 w-20 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <p className="mt-4 text-base font-medium text-gray-600">Loading projects...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your project data</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 my-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Error loading projects</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      {!isLoading && !error && (
        <div className="bg-white overflow-hidden border border-gray-100 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Project Name
                      {sortField === "name" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("client")}
                  >
                    <div className="flex items-center">
                      Client
                      {sortField === "client" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("deadline")}
                  >
                    <div className="flex items-center">
                      Deadline
                      {sortField === "deadline" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("completionPercentage")}
                  >
                    <div className="flex items-center">
                      Progress
                      {sortField === "completionPercentage" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Team
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("budget")}
                  >
                    <div className="flex items-center">
                      Budget
                      {sortField === "budget" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <ProjectRow 
                    key={project.id} 
                    project={project}
                    onProjectUpdate={(updatedProject) => {
                      setProjects(projects.map(p => 
                        p.id === updatedProject.id ? { ...p, ...updatedProject } : p
                      ));
                    }}
                  />
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Briefcase className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No projects match your current filter criteria
                        </p>
                        {(searchQuery || statusFilter) && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('');
                            }}
                            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Project Row Component
function ProjectRow({ project, onProjectUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProgressEdit, setShowProgressEdit] = useState(false);
  const [progressValue, setProgressValue] = useState(project.completionPercentage);
  const menuRef = useRef(null);
  
  // Handle click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);
  
  const handleProgressChange = async () => {
    if (progressValue === project.completionPercentage) {
      setShowProgressEdit(false);
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completionPercentage: progressValue }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update progress");
      }
      
      const data = await response.json();
      onProjectUpdate({ ...project, completionPercentage: progressValue });
      toast.success("Progress updated successfully");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
      setProgressValue(project.completionPercentage); // Reset to original value
    } finally {
      setIsUpdating(false);
      setShowProgressEdit(false);
    }
  };
  
  // Get deadline status
  const getDeadlineStatus = () => {
    const today = new Date();
    const deadline = new Date(project.deadline);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 && project.status !== 'completed') {
      return {
        label: 'Overdue',
        class: 'text-red-600'
      };
    } else if (diffDays <= 7 && project.status !== 'completed') {
      return {
        label: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
        class: 'text-amber-600'
      };
    }
    return null;
  };
  
  const deadlineStatus = getDeadlineStatus();
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <Link 
            href={`/dashboard/projects/${project.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
          >
            {project.name}
            <ArrowUpRight className="ml-1 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <span className="text-xs text-gray-500 mt-0.5">
            ID: {project.id.substring(0, 8)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-medium">{project.client.name}</div>
        {project.client.company && (
          <div className="text-xs text-gray-500 mt-0.5">{project.client.company}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={project.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatDate(project.deadline)}</div>
        {deadlineStatus && (
          <div className={`text-xs font-medium ${deadlineStatus.class} mt-0.5`}>
            {deadlineStatus.label}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {showProgressEdit ? (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{progressValue}%</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handleProgressChange}
                disabled={isUpdating}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                Save
              </button>
              <button
                onClick={() => {
                  setShowProgressEdit(false);
                  setProgressValue(project.completionPercentage);
                }}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="group cursor-pointer" 
            onClick={() => setShowProgressEdit(true)}
          >
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  project.completionPercentage >= 100 ? 'bg-green-600' :
                  project.completionPercentage >= 75 ? 'bg-blue-600' :
                  project.completionPercentage >= 50 ? 'bg-yellow-500' :
                  project.completionPercentage >= 25 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${project.completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-xs text-gray-600 font-medium">{project.completionPercentage}%</div>
              <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</div>
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {project.teamMembers?.length > 0 ? (
          <div className="flex -space-x-2 overflow-hidden">
            {project.teamMembers.slice(0, 3).map((member, index) => (
              <div
                key={member.id || index}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"
                title={member.name}
              >
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="h-8 w-8 rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-xs font-semibold text-blue-800">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
            ))}
            {project.teamMembers.length > 3 && (
              <div 
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center"
                title={project.teamMembers.slice(3).map(m => m.name).join(', ')}
              >
                <span className="text-xs font-medium text-gray-600">
                  +{project.teamMembers.length - 3}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No team assigned
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{formatCurrency(project.budget)}</div>
        {project.estimatedHours && (
          <div className="text-xs text-gray-500 mt-0.5">{project.estimatedHours} hours</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-1">
          <Link 
            href={`/dashboard/projects/${project.id}`}
            className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          
          <Link 
            href={`/dashboard/projects/${project.id}/edit`}
            className="inline-flex items-center justify-center p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            title="Edit Project"
          >
            <Edit className="w-4 h-4" />
          </Link>
          
          <button
            onClick={() => setShowProgressEdit(true)}
            className="inline-flex items-center justify-center p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
            title="Update Progress"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          
          <Link 
            href={`/dashboard/projects/${project.id}/tasks`}
            className="inline-flex items-center justify-center p-1.5 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
            title="Manage Tasks"
          >
            <CheckSquare className="w-4 h-4" />
          </Link>
          
          <Link 
            href={`/dashboard/projects/${project.id}/team`}
            className="inline-flex items-center justify-center p-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
            title="Manage Team"
          >
            <Users className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
} 