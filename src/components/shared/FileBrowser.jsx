"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  File, 
  Image, 
  FileText, 
  Film, 
  Music, 
  Trash2, 
  Download, 
  Edit, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Loader2,
  FolderOpen,
  Tag,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const FileBrowser = ({ 
  initialFiles = [], 
  onFileDelete,
  onFileUpdate,
  showSearch = true,
  showFilters = true,
  className = "",
  filter: propFilter
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [files, setFiles] = useState(initialFiles);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({
    fileType: propFilter?.fileType || "",
    folder: propFilter?.folder || "",
  });
  const [sort, setSort] = useState({
    by: "createdAt",
    order: "desc"
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalFiles: 0
  });
  const [editingFile, setEditingFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tags: "",
    isPublic: false
  });
  
  // Update filter when propFilter changes
  useEffect(() => {
    if (propFilter) {
      setFilter(prev => ({
        ...prev,
        fileType: propFilter.fileType || prev.fileType,
        folder: propFilter.folder || prev.folder
      }));
    }
  }, [propFilter]);
  
  // Fetch files on component mount and when search/filter/sort/pagination changes
  useEffect(() => {
    fetchFiles();
  }, [search, filter.fileType, filter.folder, sort.by, sort.order, pagination.page, pagination.limit]);
  
  // Fetch files from the API
  const fetchFiles = async () => {
    setLoading(true);
    
    try {
      // Build query string
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      
      if (search) {
        params.append("search", search);
      }
      
      if (filter.fileType) {
        params.append("fileType", filter.fileType);
      }
      
      if (filter.folder) {
        params.append("folder", filter.folder);
      }
      
      params.append("sortBy", sort.by);
      params.append("sortOrder", sort.order);
      
      console.log(`Fetching files with params: ${params.toString()}`);
      
      // Fetch files
      const response = await fetch(`/api/files?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("File fetch error:", errorData);
        throw new Error(errorData.message || "Failed to fetch files");
      }
      
      const data = await response.json();
      console.log(`Received ${data.files?.length || 0} files from API`);
      
      setFiles(data.files || []);
      setPagination({
        ...pagination,
        totalPages: data.pagination?.totalPages || 1,
        totalFiles: data.pagination?.totalFiles || 0
      });
    } catch (error) {
      console.error("File fetch error:", error);
      toast.error(error.message || "Failed to fetch files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file deletion
  const handleDelete = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete file");
      }
      
      // Remove file from state
      setFiles(files.filter(file => file._id !== fileId));
      
      toast.success("File deleted successfully");
      
      // Call the callback if provided
      if (onFileDelete) {
        onFileDelete(fileId);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete file");
    }
  };
  
  // Handle edit button click
  const handleEditClick = (file) => {
    setEditingFile(file);
    setEditForm({
      name: file.name || "",
      description: file.description || "",
      tags: file.tags?.join(", ") || "",
      isPublic: file.isPublic || false
    });
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  // Handle file update
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/files/${editingFile._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          tags: editForm.tags ? editForm.tags.split(",").map(tag => tag.trim()) : [],
          isPublic: editForm.isPublic
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update file");
      }
      
      const data = await response.json();
      
      // Update file in state
      setFiles(files.map(file => 
        file._id === editingFile._id ? data.file : file
      ));
      
      // Close the edit form
      setEditingFile(null);
      
      toast.success("File updated successfully");
      
      // Call the callback if provided
      if (onFileUpdate) {
        onFileUpdate(data.file);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update file");
    }
  };
  
  // Check if the current user is the owner of a file
  const isFileOwner = (file) => {
    if (!user || !file || !file.uploadedBy) return false;
    
    const userId = user.id || user._id;
    const fileOwnerId = typeof file.uploadedBy === 'object' 
      ? (file.uploadedBy._id || file.uploadedBy.id) 
      : file.uploadedBy;
      
    return userId === fileOwnerId || userId === fileOwnerId?.toString();
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType, mimeType) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-500" />;
    
    switch(fileType) {
      case "image":
        return <Image className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Film className="h-5 w-5 text-purple-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-pink-500" />;
      case "document":
        if (mimeType === "application/pdf") {
          return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <FileText className="h-5 w-5 text-amber-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with search and filters */}
      {(showSearch || showFilters) && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            {showSearch && (
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {/* Filters */}
            {showFilters && (
              <div className="flex gap-2">
                {/* File Type Filter */}
                <div className="relative">
                  <select
                    value={filter.fileType}
                    onChange={(e) => setFilter(prev => ({ ...prev, fileType: e.target.value }))}
                    className="appearance-none pl-8 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="document">Documents</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Sort Order */}
                <button
                  onClick={() => setSort(prev => ({ 
                    ...prev, 
                    order: prev.order === "asc" ? "desc" : "asc" 
                  }))}
                  className="p-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  title={sort.order === "asc" ? "Sort Descending" : "Sort Ascending"}
                >
                  {sort.order === "asc" ? (
                    <SortAsc className="h-5 w-5 text-gray-500" />
                  ) : (
                    <SortDesc className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* File List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => setSort({ by: "name", order: sort.by === "name" ? (sort.order === "asc" ? "desc" : "asc") : "asc" })}
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer"
                onClick={() => setSort({ by: "fileType", order: sort.by === "fileType" ? (sort.order === "asc" ? "desc" : "asc") : "asc" })}
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell cursor-pointer"
                onClick={() => setSort({ by: "size", order: sort.by === "size" ? (sort.order === "asc" ? "desc" : "asc") : "asc" })}
              >
                Size
              </th>
              {isAdmin && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                >
                  Uploaded By
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer"
                onClick={() => setSort({ by: "createdAt", order: sort.by === "createdAt" ? (sort.order === "asc" ? "desc" : "asc") : "asc" })}
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-sm text-gray-500">Loading files...</p>
                  </div>
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <File className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-base font-medium text-gray-500">No files found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {search || filter.fileType || filter.folder 
                        ? "Try changing your search or filters" 
                        : "Upload files to get started"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr 
                  key={file._id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                        {getFileIcon(file.fileType, file.mimeType)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.name || "Unnamed file"}
                        </div>
                        {file.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {file.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {file.fileType || "unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {formatFileSize(file.size)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {file.uploadedBy ? 
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {typeof file.uploadedBy === 'object' ? file.uploadedBy.name || 'Unknown' : 'User'}
                        </span> : 'Unknown'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {file.createdAt ? formatDate(file.createdAt) : "Unknown date"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {file.isPublic && (
                        <span title="Public file" className="text-green-500">
                          <Eye className="h-4 w-4" />
                        </span>
                      )}
                      <Link 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Download file"
                      >
                        <Download className="h-5 w-5" />
                      </Link>
                      {(isAdmin || isFileOwner(file)) && (
                        <>
                          <button
                            onClick={() => handleEditClick(file)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit file metadata"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete file"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{files.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0}</span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalFiles)}
                </span>{" "}
                of <span className="font-medium">{pagination.totalFiles}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">First Page</span>
                  <span className="text-xs">First</span>
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <span className="text-xs">Prev</span>
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    // Near the start
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    // Near the end
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    // In the middle
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNum
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <span className="text-xs">Next</span>
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Last Page</span>
                  <span className="text-xs">Last</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      <AnimatePresence>
        {editingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit File</h3>
                <button
                  onClick={() => setEditingFile(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editForm.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows="3"
                    value={editForm.description}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated, optional)
                  </label>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-400 absolute ml-3" />
                    <input
                      type="text"
                      id="edit-tags"
                      name="tags"
                      value={editForm.tags}
                      onChange={handleFormChange}
                      placeholder="e.g. report, document, project"
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-isPublic"
                    name="isPublic"
                    checked={editForm.isPublic}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this file accessible to others
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFile(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileBrowser; 