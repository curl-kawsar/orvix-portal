"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [aiEstimates, setAiEstimates] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client: "",
    startDate: "",
    deadline: "",
    budget: "",
    estimatedHours: "",
    requirements: "",
    teamSize: 1,
  });

  // Fetch clients and users from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        } else {
          console.error('Failed to fetch clients:', await clientsResponse.text());
          toast.error('Error loading clients. Please try again.');
        }

        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Failed to fetch users:', await usersResponse.text());
          toast.error('Error loading team members. Please try again.');
          // Use mock data as fallback for users
          setUsers([
            { id: "1", name: "John Doe", role: "developer" },
            { id: "2", name: "Jane Smith", role: "designer" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error('Error loading data. Please check your connection and try again.');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateAIEstimate = async () => {
    // Check if required fields are filled
    if (!formData.name || !formData.description) {
      toast.error("Please provide project name and description for AI estimates");
      return;
    }

    setIsGeneratingAI(true);
    
    try {
      const response = await fetch("/api/ai/project-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI estimates");
      }

      const data = await response.json();
      setAiEstimates(data);
      
      // Update form with AI estimates
      setFormData((prev) => ({
        ...prev,
        estimatedHours: data.estimatedHours,
        budget: data.estimatedCost,
      }));

      toast.success("AI estimates generated successfully!");
    } catch (error) {
      console.error("Error generating AI estimates:", error);
      toast.error("Failed to generate AI estimates. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.client) {
        toast.error("Please select a client");
        setIsLoading(false);
        return;
      }

      // Create the project
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          client: formData.client,
          startDate: formData.startDate,
          deadline: formData.deadline,
          budget: formData.budget ? Number(formData.budget) : 0,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : 0,
          teamSize: formData.teamSize ? Number(formData.teamSize) : 1,
          requirements: formData.requirements,
          aiEstimates: aiEstimates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create project");
      }

      const data = await response.json();
      console.log("Created project:", data);

      toast.success("Project created successfully!");
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to create a new project
        </p>
      </div>

      {isLoadingData ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
          <span className="text-gray-600">Loading...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
              Project Details
            </h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-3">
                <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                  Client *
                </label>
                <div className="mt-1">
                  <select
                    id="client"
                    name="client"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.client}
                    onChange={handleChange}
                  >
                    <option value="">Select Client</option>
                    {clients.length === 0 ? (
                      <option disabled>No clients available</option>
                    ) : (
                      clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company ? `(${client.company})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {clients.length === 0 && (
                  <p className="mt-2 text-sm text-orange-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No clients available. <a href="/dashboard/clients/new" className="ml-1 underline">Add a client</a> first.
                  </p>
                )}
              </div>
  
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Project Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-6">
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                  Project Requirements
                </label>
                <div className="mt-1">
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Detailed requirements will help AI generate more accurate estimates.
                </p>
              </div>
  
              <div className="sm:col-span-3">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-3">
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Deadline *
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="deadline"
                    id="deadline"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-2">
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="budget"
                    id="budget"
                    min="0"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-2">
                <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                  Estimated Hours
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="estimatedHours"
                    id="estimatedHours"
                    min="0"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-2">
                <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700">
                  Team Size
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="teamSize"
                    id="teamSize"
                    min="1"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.teamSize}
                    onChange={handleChange}
                  />
                </div>
              </div>
  
              <div className="sm:col-span-6">
                <button
                  type="button"
                  onClick={generateAIEstimate}
                  disabled={isGeneratingAI || !formData.name || !formData.description}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Generating Estimates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Estimates
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
  
          {/* AI Estimates Section */}
          {aiEstimates && (
            <div className="bg-purple-50 shadow rounded-lg p-6 border border-purple-100">
              <h2 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                AI Generated Estimates
              </h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500">Estimated Hours</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{aiEstimates.estimatedHours} hours</p>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500">Estimated Cost</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ${aiEstimates.estimatedCost.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500">Recommended Team Size</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {Math.ceil(aiEstimates.estimatedHours / 160)} members
                  </p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Recommended Tech Stack</h3>
                  <ul className="space-y-1">
                    {aiEstimates.techStack.map((tech, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="inline-block h-4 w-4 rounded-full bg-purple-200 mr-2 mt-0.5"></span>
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Potential Challenges</h3>
                  <ul className="space-y-1">
                    {aiEstimates.challenges.map((challenge, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
  
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || clients.length === 0}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 