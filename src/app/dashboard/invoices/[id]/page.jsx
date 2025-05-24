"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Edit,
  Trash,
  Printer,
  Download,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { isValidObjectId } from "@/lib/utils";

export default function InvoicePage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        // We no longer need to validate the ObjectId format here,
        // since our API now handles both ObjectId and invoice number formats
        const response = await fetch(`/api/invoices/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch invoice");
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
        
        // Only redirect for certain errors, not for invalid format now
        if (err.message === "Invoice not found") {
          setTimeout(() => {
            router.push("/dashboard/finance");
          }, 3000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invoice");
      }
      
      toast.success("Invoice deleted successfully");
      router.push("/dashboard/finance");
    } catch (err) {
      console.error("Error deleting invoice:", err);
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paid",
          paymentDate: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update invoice");
      }
      
      const data = await response.json();
      setInvoice(data.invoice);
      toast.success("Invoice marked as paid");
    } catch (err) {
      console.error("Error updating invoice:", err);
      toast.error(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      "draft": { color: "bg-gray-100 text-gray-800", icon: <FileText className="w-4 h-4 mr-1" /> },
      "sent": { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4 mr-1" /> },
      "paid": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4 mr-1" /> },
      "overdue": { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4 mr-1" /> },
      "cancelled": { color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-4 h-4 mr-1" /> },
    };

    const config = statusConfig[status] || statusConfig["draft"];
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-full ${config.color}`}>
        {config.icon}
        {displayStatus}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="ml-4 text-xl font-medium text-gray-600">Loading invoice...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Invoice Error</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error === "Invoice not found" 
                  ? "The requested invoice could not be found. It may have been deleted or you may not have permission to view it." 
                  : "There was a problem loading this invoice."}</p>
              </div>
              <div className="mt-4">
                {error === "Invoice not found" && <p className="text-sm text-red-700 mb-2">You will be redirected to the Finance Dashboard automatically...</p>}
                <Link 
                  href="/dashboard/finance" 
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Go to Finance Dashboard Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/finance"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Not Found</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            The requested invoice could not be found. It may have been deleted or you may not have permission to view it.
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
            href="/dashboard/finance"
            className="mr-2 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          
          <button
            onClick={() => {}} // Placeholder for download functionality
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          
          {invoice.status !== "paid" && (
            <button
              onClick={handleMarkAsPaid}
              className="inline-flex items-center px-4 py-2 border border-transparent bg-green-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </button>
          )}
          
          <Link
            href={`/dashboard/invoices/${invoice._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          
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
        </div>
      </div>
      
      {/* Invoice Status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white rounded-lg shadow p-6">
        <div>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="mt-4 sm:mt-0 text-sm text-gray-500">
          Created on {formatDate(invoice.createdAt)}
        </div>
      </div>
      
      {/* Invoice Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-900 font-medium mt-2"># {invoice.invoiceNumber}</p>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">FROM</h3>
                <p className="text-gray-900 font-medium">Orvix 360</p>
                <p className="text-gray-600">King Sreepur, Chauddagram, Cumilla</p>
                <p className="text-gray-600">info@orvix360.com</p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">TO</h3>
                <p className="text-gray-900 font-medium">{invoice.client?.name}</p>
                <p className="text-gray-600">{invoice.client?.email}</p>
                <p className="text-gray-600">{invoice.client?.company || ''}</p>
              </div>
            </div>
            
            <div className="grow-0 lg:text-right">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">INVOICE DATE</h3>
                <p className="text-gray-900">{formatDate(invoice.issuedDate)}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">DUE DATE</h3>
                <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">PROJECT</h3>
                <p className="text-gray-900">{invoice.project?.name}</p>
              </div>
              
              {invoice.status === 'paid' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">PAYMENT DATE</h3>
                  <p className="text-gray-900">{formatDate(invoice.paymentDate)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Invoice Items */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items && invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.amount)}
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
                      {formatCurrency(invoice.subtotal)}
                    </dd>
                  </div>
                  
                  {invoice.taxRate > 0 && (
                    <>
                      <div className="flex justify-between py-2">
                        <dt className="text-sm font-medium text-gray-700">Tax ({invoice.taxRate}%)</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.taxAmount)}
                        </dd>
                      </div>
                    </>
                  )}
                  
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium text-gray-700">Discount</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.discount)}
                      </dd>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                    <dt className="text-base font-bold text-gray-900">Total</dt>
                    <dd className="text-base font-bold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-8 space-y-4">
              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">NOTES</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              
              {invoice.terms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">TERMS</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 