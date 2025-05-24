"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Trash,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { isValidObjectId } from "@/lib/utils";

export default function EditInvoicePage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  // Main form state
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    client: "",
    project: "",
    issuedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
    currency: "USD",
    status: "draft",
    notes: "",
    terms: "",
  });
  
  // Data for dropdowns
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // We no longer need to validate the ObjectId format here,
        // since our API now handles both ObjectId and invoice number formats
        const response = await fetch(`/api/invoices/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch invoice");
        }
        
        const invoice = await response.json();
        
        // Format dates for inputs
        const formattedInvoice = {
          ...invoice,
          issuedDate: invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : "",
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
          paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : "",
          client: invoice.client?._id || invoice.client?.id || "",
          project: invoice.project?._id || invoice.project?.id || "",
        };
        
        setInvoiceData(formattedInvoice);
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
        
        // Only redirect for certain errors
        if (err.message === "Invoice not found") {
          toast.error("You will be redirected to the Finance Dashboard shortly");
          setTimeout(() => {
            router.push("/dashboard/finance");
          }, 3000);
        }
      }
    };
    
    fetchInvoice();
  }, [id, router]);
  
  // Fetch clients and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResponse, projectsResponse] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects")
        ]);
        
        if (!clientsResponse.ok || !projectsResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const clientsData = await clientsResponse.json();
        const projectsData = await projectsResponse.json();
        
        setClients(clientsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load clients and projects");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter projects based on selected client
  useEffect(() => {
    if (invoiceData.client && projects.length > 0) {
      const filtered = projects.filter(project => project.client.id === invoiceData.client);
      setFilteredProjects(filtered.length > 0 ? filtered : projects);
    } else {
      setFilteredProjects(projects);
    }
  }, [invoiceData.client, projects]);
  
  // Recalculate amounts when line items change
  useEffect(() => {
    // Calculate subtotal
    const subtotal = invoiceData.items.reduce((total, item) => total + (item.amount || 0), 0);
    
    // Calculate tax
    const taxAmount = (subtotal * (invoiceData.taxRate / 100));
    
    // Calculate total
    const total = subtotal + taxAmount - (invoiceData.discount || 0);
    
    // Update state without modifying items
    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [invoiceData.items, invoiceData.taxRate, invoiceData.discount]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle line item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;
    
    // Calculate amount for this item
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0;
      const unitPrice = field === "unitPrice" ? parseFloat(value) || 0 : parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = quantity * unitPrice;
    }
    
    setInvoiceData(prev => ({
      ...prev,
      items: newItems
    }));
  };
  
  // Add a new line item
  const handleAddItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unitPrice: 0, amount: 0 }
      ]
    }));
  };
  
  // Remove a line item
  const handleRemoveItem = (index) => {
    if (invoiceData.items.length === 1) {
      toast.error("Invoice must have at least one item");
      return;
    }
    
    const newItems = [...invoiceData.items];
    newItems.splice(index, 1);
    
    setInvoiceData(prev => ({
      ...prev,
      items: newItems
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!invoiceData.client || !invoiceData.project || !invoiceData.invoiceNumber || !invoiceData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate line items
    const hasEmptyItems = invoiceData.items.some(item => !item.description || item.quantity <= 0);
    if (hasEmptyItems) {
      toast.error("Please fill in all line item details");
      return;
    }
    
    // No need to validate invoice ID format here anymore
    
    setIsSubmitting(true);
    
    try {
      // Remove client and project objects if they exist (we just want to send IDs)
      const dataToSend = {
        ...invoiceData,
        client: typeof invoiceData.client === 'object' ? invoiceData.client._id : invoiceData.client,
        project: typeof invoiceData.project === 'object' ? invoiceData.project._id : invoiceData.project
      };
      
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update invoice");
      }
      
      const data = await response.json();
      toast.success("Invoice updated successfully");
      
      // Return to the invoice detail page
      router.push(`/dashboard/invoices/${id}`);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoiceData.currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="ml-2 text-lg font-medium text-gray-600">Loading invoice...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link 
            href="/dashboard/finance"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Invoice</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error === "Invalid invoice ID format" 
                  ? "The invoice ID does not match the required format. You will be redirected to the finance dashboard." 
                  : "Please try again or return to the invoices list."}</p>
              </div>
              <div className="mt-4">
                <Link 
                  href="/dashboard/finance" 
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Return to Invoices
                </Link>
              </div>
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
          <Link 
            href={`/dashboard/invoices/${id}`}
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Invoice {invoiceData.invoiceNumber}</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Header Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">
                Invoice Number *
              </label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={invoiceData.invoiceNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                Client *
              </label>
              <select
                id="client"
                name="client"
                value={invoiceData.client}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                Project *
              </label>
              <select
                id="project"
                name="project"
                value={invoiceData.project}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select Project</option>
                {filteredProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="issuedDate" className="block text-sm font-medium text-gray-700">
                Issued Date *
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="issuedDate"
                  name="issuedDate"
                  value={invoiceData.issuedDate}
                  onChange={handleChange}
                  className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date *
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={invoiceData.dueDate}
                  onChange={handleChange}
                  className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={invoiceData.currency}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={invoiceData.status}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {invoiceData.status === "paid" && (
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={invoiceData.paymentDate || new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                    className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Invoice Items Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceData.items && invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Item description"
                        className="block w-full border-0 p-0 focus:ring-0 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity || 1}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="block w-full border-0 p-0 text-right focus:ring-0 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || 0}
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                        className="block w-full border-0 p-0 text-right focus:ring-0 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Invoice Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-700">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoiceData.subtotal)}
                  </dd>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm font-medium text-gray-700">Tax Rate (%)</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      name="taxRate"
                      value={invoiceData.taxRate || 0}
                      onChange={handleChange}
                      className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                    />
                  </dd>
                </div>
                
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-700">Tax Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoiceData.taxAmount)}
                  </dd>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm font-medium text-gray-700">Discount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="discount"
                      value={invoiceData.discount || 0}
                      onChange={handleChange}
                      className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                    />
                  </dd>
                </div>
                
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <dt className="text-base font-bold text-gray-900">Total</dt>
                  <dd className="text-base font-bold text-gray-900">
                    {formatCurrency(invoiceData.total)}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes and Terms */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notes and Terms</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={invoiceData.notes || ''}
                onChange={handleChange}
                placeholder="Notes to client"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="terms" className="block text-sm font-medium text-gray-700">
                Terms
              </label>
              <textarea
                id="terms"
                name="terms"
                rows={3}
                value={invoiceData.terms || ''}
                onChange={handleChange}
                placeholder="Invoice terms"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            href={`/dashboard/invoices/${id}`}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 inline" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 