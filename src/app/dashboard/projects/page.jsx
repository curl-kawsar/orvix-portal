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
  Loader2
} from "lucide-react";
import { toast } from "sonner";

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    "planning": { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4 mr-1" /> },
    "in-progress": { color: "bg-yellow-100 text-yellow-800", icon: <Briefcase className="w-4 h-4 mr-1" /> },
    "review": { color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="w-4 h-4 mr-1" /> },
    "completed": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4 mr-1" /> },
    "on-hold": { color: "bg-orange-100 text-orange-800", icon: <PauseCircle className="w-4 h-4 mr-1" /> },
    "cancelled": { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4 mr-1" /> },
  };

  const config = statusConfig[status] || statusConfig["planning"];
  const displayStatus = status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${config.color}`}>
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

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("deadline");
  const [sortDirection, setSortDirection] = useState("asc");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
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
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-500">Loading projects...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      {!isLoading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No projects found matching your criteria
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
  
  return (
    <tr key={project.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-blue-600">
          <Link href={`/dashboard/projects/${project.id}`}>
            {project.name}
          </Link>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{project.client.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={project.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatDate(project.deadline)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {showProgressEdit ? (
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-xs font-medium">{progressValue}%</span>
            <button
              onClick={handleProgressChange}
              disabled={isUpdating}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setShowProgressEdit(false);
                setProgressValue(project.completionPercentage);
              }}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div 
            className="group cursor-pointer" 
            onClick={() => setShowProgressEdit(true)}
          >
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  project.completionPercentage >= 100 ? 'bg-green-600' :
                  project.completionPercentage >= 75 ? 'bg-blue-600' :
                  project.completionPercentage >= 50 ? 'bg-yellow-400' :
                  'bg-orange-500'
                }`}
                style={{ width: `${project.completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between">
              <div className="text-xs text-gray-500 mt-1">{project.completionPercentage}% complete</div>
              <div className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 mt-1">Edit</div>
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
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center"
                title={member.name}
              >
                <span className="text-xs font-medium text-blue-800">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            ))}
            {project.teamMembers.length > 3 && (
              <div 
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center"
                title={project.teamMembers.slice(3).map(m => m.name).join(', ')}
              >
                <span className="text-xs font-medium text-gray-600">
                  +{project.teamMembers.length - 3}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-500">No team assigned</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatCurrency(project.budget)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-gray-500"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {isMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <Link 
                  href={`/dashboard/projects/${project.id}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Details
                </Link>
                <Link 
                  href={`/dashboard/projects/${project.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Project
                </Link>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowProgressEdit(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Update Progress
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
} 