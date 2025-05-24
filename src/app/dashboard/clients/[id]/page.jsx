"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Tag,
  ChevronLeft,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id;
  
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const fetchClientDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Client not found");
          router.push("/dashboard/clients");
          return;
        }
        throw new Error("Failed to fetch client details");
      }
      
      const data = await response.json();
      setClient(data);
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast.error("Failed to load client details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (deleteConfirm !== client.name) {
      toast.error("Please type the client name correctly to confirm deletion");
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete client");
      }
      
      toast.success("Client deleted successfully");
      router.push("/dashboard/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "prospect":
        return "bg-blue-100 text-blue-800";
      case "former":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Client not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The client you're looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Clients
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
            href="/dashboard/clients"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(client.status)}`}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/clients/${clientId}/edit`}
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

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and contact details</p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>Client ID: {clientId}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Full Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Company
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.company || "-"}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone || "-"}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Website
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {client.website ? (
                  <a 
                    href={client.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {client.website}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : "-"}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Industry
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.industry || "-"}</dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {client.notes || "No additional notes."}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Projects section would go here */}
      
      {/* Delete Confirmation Modal */}
      <div id="delete-modal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Client</h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  Type <span className="font-semibold">{client.name}</span> to confirm:
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
                onClick={handleDeleteClient}
                disabled={deleteConfirm !== client.name || isDeleting}
                className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                    Deleting...
                  </>
                ) : (
                  "Delete Client"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
} 