"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Key,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "development",
    role: "developer",
    bio: "",
  });
  
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({
    name: "",
    proficiency: 70,
    yearsOfExperience: 1
  });

  // Credentials state
  const [credentialType, setCredentialType] = useState("generate"); // "manual" or "generate"
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Password copied to clipboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add validation
      if (!formData.name || !formData.email) {
        toast.error("Name and email are required");
        setIsLoading(false);
        return;
      }

      // Password validation
      if (credentialType === "manual") {
        if (!password) {
          toast.error("Password is required");
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsLoading(false);
          return;
        }

        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsLoading(false);
          return;
        }
      }

      const userData = {
        ...formData,
        skills: skills,
        ...(credentialType === "manual" ? { password } : { generatePassword: true })
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create team member");
      }

      const data = await response.json();
      
      if (credentialType === "generate" && data.temporaryPassword) {
        setGeneratedPassword(data.temporaryPassword);
        toast.success("Team member created successfully! Copy the generated password before leaving this page.");
      } else {
        toast.success("Team member created successfully!");
        router.push("/dashboard/team");
      }
    } catch (error) {
      console.error("Error creating team member:", error);
      toast.error("Failed to create team member: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/team"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Team
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add Team Member</h1>
        </div>
      </div>

      {generatedPassword ? (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Team Member Created Successfully!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Make sure to copy the generated password for this user.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Temporary Password</p>
                <p className="text-lg font-mono">{generatedPassword}</p>
              </div>
              <button 
                type="button" 
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Link
              href="/dashboard/team"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Team List
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-500" />
                Basic Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and role</p>
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
                  <p className="mt-1 text-xs text-gray-500">
                    This determines the permissions and access level of the team member.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Key className="h-5 w-5 mr-2 text-gray-500" />
                Login Credentials
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Login information for the team member</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Password Option</label>
                  <fieldset className="mt-2">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="generate"
                          name="credentialType"
                          type="radio"
                          checked={credentialType === "generate"}
                          onChange={() => setCredentialType("generate")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="generate" className="ml-3 block text-sm text-gray-700">
                          Generate a secure random password
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="manual"
                          name="credentialType"
                          type="radio"
                          checked={credentialType === "manual"}
                          onChange={() => setCredentialType("manual")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="manual" className="ml-3 block text-sm text-gray-700">
                          Set password manually
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
                
                {credentialType === "manual" && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="password"
                          required={credentialType === "manual"}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters long.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password *
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="confirmPassword"
                          required={credentialType === "manual"}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {credentialType === "generate" && (
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Key className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          A secure random password will be generated when the user is created. You'll be able to copy it after submission.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-gray-500" />
                Skills & Expertise
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Add team member's skills and proficiency levels</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
              <div className="space-y-5">
                {skills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Added Skills:</h4>
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

                <div className="border-t border-gray-200 pt-5">
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
                <p className="mt-2 text-sm text-gray-500">
                  Brief description to be displayed on team member's profile.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/team"
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Team Member
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 