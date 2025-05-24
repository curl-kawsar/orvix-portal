"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Users,
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield,
  Tag,
  MessageSquare,
  ChevronLeft,
  Loader2,
  Save,
  Plus,
  X,
  Key
} from "lucide-react";
import { toast } from "sonner";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    role: "",
    bio: "",
    status: "active"
  });
  
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({
    name: "",
    proficiency: 70,
    yearsOfExperience: 1
  });

  const [changePassword, setChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

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
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        title: data.title || "",
        department: data.department || "",
        role: data.role || "developer",
        bio: data.bio || "",
        status: data.status || "active"
      });
      
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Error fetching team member details:", error);
      toast.error("Failed to load team member details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (e) => {
    const { name, value } = e.target;
    setNewSkill((prev) => ({ 
      ...prev, 
      [name]: name === 'proficiency' || name === 'yearsOfExperience' ? Number(value) : value 
    }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.name) {
      toast.error("Skill name is required");
      return;
    }
    
    setSkills((prev) => [...prev, { ...newSkill }]);
    setNewSkill({
      name: "",
      proficiency: 70,
      yearsOfExperience: 1
    });
  };

  const removeSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate
      if (!formData.name || !formData.email) {
        toast.error("Name and email are required");
        setIsSaving(false);
        return;
      }

      // Password validation
      if (changePassword) {
        if (!passwordData.newPassword) {
          toast.error("New password is required");
          setIsSaving(false);
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
        }

        if (passwordData.newPassword.length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsSaving(false);
          return;
        }
      }

      const userData = {
        ...formData,
        skills: skills,
        ...(changePassword && { password: passwordData.newPassword })
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update team member");
      }

      toast.success("Team member updated successfully!");
      router.push(`/dashboard/team/${userId}`);
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Failed to update team member: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/team/${userId}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-500" />
              Basic Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Update personal details and role</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="department"
                    name="department"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                    <option value="management">Management</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="marketer">Marketer</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-gray-500" />
              Skills & Expertise
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Update skills and proficiency levels</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <div className="space-y-5">
              {skills.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Skills:</h4>
                  <ul className="divide-y divide-gray-200">
                    {skills.map((skill, index) => (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                          <div className="mt-1 flex items-center">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full" 
                                style={{ width: `${skill.proficiency}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-500">{skill.proficiency}%</span>
                            <span className="ml-4 text-xs text-gray-500">{skill.yearsOfExperience} years</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeSkill(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`${skills.length > 0 ? 'border-t border-gray-200 pt-5' : ''}`}>
                <h4 className="text-sm font-medium text-gray-700">Add a new skill:</h4>
                <div className="mt-3 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="skillName" className="block text-sm font-medium text-gray-700">
                      Skill Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="skillName"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={newSkill.name}
                        onChange={handleSkillChange}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700">
                      Proficiency (%)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="proficiency"
                        id="proficiency"
                        min="1"
                        max="100"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={newSkill.proficiency}
                        onChange={handleSkillChange}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                      Years
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="yearsOfExperience"
                        id="yearsOfExperience"
                        min="0"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={newSkill.yearsOfExperience}
                        onChange={handleSkillChange}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={addSkill}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
              Bio
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Additional information about the team member</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio / About
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Brief description or biography of the team member"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Key className="h-5 w-5 mr-2 text-gray-500" />
              Password
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Update user password</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="changePassword"
                  name="changePassword"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={changePassword}
                  onChange={() => setChangePassword(!changePassword)}
                />
                <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-900">
                  Change Password
                </label>
              </div>

              {changePassword && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/dashboard/team/${userId}`}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 