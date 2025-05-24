"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  User,
  Mail, 
  Phone, 
  Briefcase,
  Calendar,
  Tag,
  ChevronLeft,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Shield,
  MessageSquare,
  Award,
  Star
} from "lucide-react";
import { toast } from "sonner";

export default function TeamMemberDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    fetchMemberDetails();
  }, [userId]);

  const fetchMemberDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Team member not found");
          router.push("/dashboard/team");
          return;
        }
        throw new Error("Failed to fetch team member details");
      }
      
      const data = await response.json();
      setMember(data);
    } catch (error) {
      console.error("Error fetching team member details:", error);
      toast.error("Failed to load team member details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (deleteConfirm !== member.name) {
      toast.error("Please type the team member's name correctly to confirm deletion");
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete team member");
      }
      
      toast.success("Team member deleted successfully");
      router.push("/dashboard/team");
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast.error("Failed to delete team member");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "developer":
        return "bg-green-100 text-green-800";
      case "designer":
        return "bg-pink-100 text-pink-800";
      case "marketer":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Team member not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The team member you're looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/team"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/team"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Team Members
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(member.role)}`}>
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/team/${userId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => document.getElementById("delete-modal").classList.remove("hidden")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and contact</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-5">
                {member.avatar ? (
                  <img 
                    className="w-full h-full object-cover" 
                    src={member.avatar} 
                    alt={`${member.name}'s avatar`} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              {member.title && (
                <p className="text-sm text-gray-500 mt-1">{member.title}</p>
              )}
              
              <div className="mt-5 w-full">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      Email
                    </dt>
                    <dd className="text-sm text-gray-900">{member.email}</dd>
                  </div>
                  
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      Phone
                    </dt>
                    <dd className="text-sm text-gray-900">{member.phone || "-"}</dd>
                  </div>
                  
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      Role
                    </dt>
                    <dd className="text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </dd>
                  </div>
                  
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      Department
                    </dt>
                    <dd className="text-sm text-gray-900">{member.department || "-"}</dd>
                  </div>
                  
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      Joined
                    </dt>
                    <dd className="text-sm text-gray-900">{formatDate(member.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Skills & Expertise</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Technical and professional skills</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {member.skills && member.skills.length > 0 ? (
                <div className="space-y-4">
                  {member.skills.map((skill, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-1/3 flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                      </div>
                      <div className="w-2/3">
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" 
                            style={{ width: `${skill.proficiency}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>Proficiency: {skill.proficiency}%</span>
                          <span>{skill.yearsOfExperience} years</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No skills have been added yet.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Projects</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Active and recent projects</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {member.projects && member.projects.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {member.projects.map((project) => (
                    <li key={project.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                          <div className="ml-3">
                            <Link 
                              href={`/dashboard/projects/${project.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {project.name}
                            </Link>
                            <p className="text-xs text-gray-500">{project.description?.substring(0, 60)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {project.role && (
                            <span className="text-xs text-gray-500 mr-3">{project.role}</span>
                          )}
                          <div className="flex">
                            {Array(project.performance || 3).fill().map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No projects assigned yet.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Bio</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">About the team member</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {member.bio ? (
                <p className="text-sm text-gray-700 whitespace-pre-line">{member.bio}</p>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No bio information added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <div id="delete-modal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Team Member</h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this team member? This action cannot be undone.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  Type <span className="font-semibold">{member.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between px-4 py-3">
              <button
                onClick={() => {
                  document.getElementById("delete-modal").classList.add("hidden");
                  setDeleteConfirm("");
                }}
                className="bg-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteConfirm !== member.name || isDeleting}
                className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                    Deleting...
                  </>
                ) : (
                  "Delete Member"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 