"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  Trash2,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function ExpenseDetailsPage({ params }) {
  const { id } = params;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    category: "",
    project: "",
    paymentMethod: "",
    notes: "",
    status: "",
    monthlyRecurring: false
  });
  
  const [originalData, setOriginalData] = useState({});
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Format date for status badge display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const statusConfig = {
    "pending": { 
      color: "bg-yellow-100 text-yellow-800", 
      icon: <Clock className="w-4 h-4 mr-1" />,
      label: "Pending Approval"
    },
    "approved": { 
      color: "bg-green-100 text-green-800", 
      icon: <CheckCircle className="w-4 h-4 mr-1" />,
      label: "Approved"
    },
    "rejected": { 
      color: "bg-red-100 text-red-800", 
      icon: <XCircle className="w-4 h-4 mr-1" />,
      label: "Rejected"
    },
    "reimbursed": { 
      color: "bg-blue-100 text-blue-800", 
      icon: <UserCheck className="w-4 h-4 mr-1" />,
      label: "Reimbursed"
    }
  };
  
  // Format payment method for display
  const formatPaymentMethod = (method) => {
    if (!method) return '';
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch expense details
        const expenseResponse = await fetch(`/api/expenses/${id}`);
        
        if (!expenseResponse.ok) {
          if (expenseResponse.status === 404) {
            throw new Error("Expense not found");
          }
          
          const errorData = await expenseResponse.json();
          throw new Error(errorData.message || "Failed to fetch expense");
        }
        
        const expenseData = await expenseResponse.json();
        setFormData({
          description: expenseData.description || "",
          amount: expenseData.amount || "",
          date: expenseData.date ? new Date(expenseData.date).toISOString().split('T')[0] : "",
          category: expenseData.category || "",
          project: expenseData.project?.id || "",
          paymentMethod: expenseData.paymentMethod || "",
          notes: expenseData.notes || "",
          status: expenseData.status || "pending",
          monthlyRecurring: expenseData.monthlyRecurring || false
        });
        setOriginalData(expenseData);
        
        // Fetch projects for dropdown
        const projectsResponse = await fetch("/api/projects");
        if (!projectsResponse.ok) {
          throw new Error("Failed to fetch projects");
        }
        
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
        toast.error(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.description || !formData.amount || !formData.category || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update expense");
      }
      
      const result = await response.json();
      toast.success("Expense updated successfully");
      
      // Update original data
      setOriginalData(prev => ({
        ...prev,
        ...formData,
        project: formData.project 
          ? { id: formData.project, name: projects.find(p => p.id === formData.project)?.name }
          : null
      }));
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete expense");
      }
      
      toast.success("Expense deleted successfully");
      router.push("/dashboard/finance");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(error.message);
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="ml-2 text-lg font-medium text-gray-600">Loading expense details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/finance" className="mr-4 p-2 rounded-md hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error} <Link href="/dashboard/finance" className="font-medium underline">Go back to Finance</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/finance" className="mr-4 p-2 rounded-md hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
        </div>
        <div className="flex items-center space-x-3">
          {originalData.status && (
            <div className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-full ${statusConfig[originalData.status].color}`}>
              {statusConfig[originalData.status].icon}
              {statusConfig[originalData.status].label}
            </div>
          )}
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="py-2 px-3 border border-red-300 text-red-700 hover:bg-red-50 rounded-md inline-flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Expense metadata */}
      <div className="bg-gray-50 rounded-lg shadow-sm p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Created by:</span>{" "}
          <span className="font-medium">{originalData.recordedBy?.name || "Unknown"}</span>
        </div>
        <div>
          <span className="text-gray-500">Created on:</span>{" "}
          <span className="font-medium">{formatDate(originalData.createdAt)}</span>
        </div>
        {originalData.approvedBy && (
          <div>
            <span className="text-gray-500">Approved by:</span>{" "}
            <span className="font-medium">{originalData.approvedBy.name}</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-7 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a category</option>
                <option value="salary">Salary</option>
                <option value="tools">Tools</option>
                <option value="hosting">Hosting</option>
                <option value="marketing">Marketing</option>
                <option value="office">Office</option>
                <option value="travel">Travel</option>
                <option value="utilities">Utilities</option>
                <option value="taxes">Taxes</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                id="project"
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Not associated with a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a payment method</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="company_card">Company Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any additional information about this expense..."
              />
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="monthlyRecurring"
                  name="monthlyRecurring"
                  type="checkbox"
                  checked={formData.monthlyRecurring}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="monthlyRecurring" className="font-medium text-gray-700">Monthly recurring expense</label>
                <p className="text-gray-500">Mark if this expense occurs monthly</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
          <Link
            href="/dashboard/finance"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Expense"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 