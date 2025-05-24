"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Edit,
  Trash,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  XCircle,
  Users,
  DollarSign,
  BarChart2,
  Briefcase,
  FileText,
  Loader2,
  Save,
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
    <span className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-full ${config.color}`}>
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
  }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "-";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export default function ProjectPage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for editing
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    status: "",
    deadline: "",
    budget: 0,
    completionPercentage: 0,
  });

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error("Invalid project ID format");
        }
        
        const response = await fetch(`/api/projects/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch project");
        }
        
        const data = await response.json();
        setProject(data);
        
        // Initialize edit data with current project data
        setEditData({
          name: data.name,
          description: data.description,
          status: data.status,
          deadline: new Date(data.deadline).toISOString().split('T')[0],
          budget: data.budget,
          completionPercentage: data.completionPercentage,
        });
      } catch (err) {
        console.error("Error loading project:", err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete project");
      }
      
      toast.success("Project deleted successfully");
      router.push("/dashboard/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: name === "completionPercentage" || name === "budget" ? Number(value) : value
    }));
  };
  
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update project");
      }
      
      const { project: updatedProject } = await response.json();
      setProject(updatedProject);
      toast.success("Project updated successfully");
      setEditMode(false);
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="ml-4 text-xl font-medium text-gray-600">Loading project...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/projects"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Project Error</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error === "Invalid project ID format" 
                  ? "The requested project ID format is invalid. Only valid MongoDB Object IDs are supported." 
                  : "There was a problem loading this project."}</p>
              </div>
              <div className="mt-4">
                <Link 
                  href="/dashboard/projects" 
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Return to Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/projects"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            The requested project could not be found. It may have been deleted or you may not have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center">
          <Link
            href="/dashboard/projects"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500">
              Client: {project.client.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!editMode && (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`inline-flex items-center px-4 py-2 border border-transparent bg-red-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 ${
                  isDeleting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4 mr-2" />
                )}
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Project Status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white rounded-lg shadow p-6">
        <div>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-4 sm:mt-0 text-sm text-gray-500">
          Created on {formatDate(project.createdAt)}
        </div>
      </div>
      
      {/* Project Details */}
      {!editMode ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Description</h2>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{project.description}</p>
                </div>
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Progress</h2>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
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
                    <div className="text-sm font-medium text-gray-900 mt-1">{project.completionPercentage}% complete</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Start Date</div>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{formatDate(project.startDate)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Deadline</div>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{formatDate(project.deadline)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Budget</div>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{formatCurrency(project.budget)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Estimated Hours</div>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{project.estimatedHours || 0} hours</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Team Members */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Team Members</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.teamMembers && project.teamMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-800 font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                        <div className="text-xs text-gray-500 mt-1">{member.hoursLogged || 0} hours logged</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!project.teamMembers || project.teamMembers.length === 0) && (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                    No team members assigned yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Edit mode form
        <form onSubmit={handleUpdateProject} className="bg-white shadow rounded-lg overflow-hidden p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={editData.status}
                onChange={handleEditChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={editData.deadline}
                onChange={handleEditChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                Budget
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  min="0"
                  value={editData.budget}
                  onChange={handleEditChange}
                  className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="completionPercentage" className="block text-sm font-medium text-gray-700">
                Completion Percentage: {editData.completionPercentage}%
              </label>
              <input
                type="range"
                id="completionPercentage"
                name="completionPercentage"
                min="0"
                max="100"
                step="5"
                value={editData.completionPercentage}
                onChange={handleEditChange}
                className="mt-1 block w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={editData.description}
                onChange={handleEditChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                isUpdating ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 