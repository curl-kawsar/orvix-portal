"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, File, Image, FileText, Film, Music, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FileUploader = ({ 
  onUploadComplete, 
  allowedTypes = ["image/*", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  maxSize = 10, // in MB
  showPreview = true,
  folder = "general",
  className = ""
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadata, setMetadata] = useState({
    name: "",
    description: "",
    tags: "",
    isPublic: false
  });
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const category = type.split('/')[0];
        return selectedFile.type.startsWith(`${category}/`);
      }
      return selectedFile.type === type;
    });
    
    if (!isAllowedType) {
      toast.error("File type not allowed");
      return;
    }
    
    // Check file size
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      toast.error(`File size exceeds the limit (${maxSize}MB)`);
      return;
    }
    
    // Set file and create preview for images
    setFile(selectedFile);
    setMetadata(prev => ({ ...prev, name: selectedFile.name }));
    
    if (selectedFile.type.startsWith("image/") && showPreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  // Get file icon based on type
  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8" />;
    
    if (file.type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type.startsWith("video/")) {
      return <Film className="h-8 w-8 text-purple-500" />;
    } else if (file.type.startsWith("audio/")) {
      return <Music className="h-8 w-8 text-pink-500" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
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
  
  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", metadata.name);
      formData.append("description", metadata.description);
      formData.append("folder", folder);
      formData.append("tags", metadata.tags);
      formData.append("isPublic", metadata.isPublic);
      
      // Simulate progress (since fetch doesn't have progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Upload file
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
      
      setUploadProgress(100);
      
      const data = await response.json();
      
      toast.success("File uploaded successfully");
      
      // Reset the form
      setFile(null);
      setPreview(null);
      setMetadata({
        name: "",
        description: "",
        tags: "",
        isPublic: false
      });
      
      // Call the callback with the uploaded file data
      if (onUploadComplete) {
        onUploadComplete(data.file);
      }
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setPreview(null);
    setMetadata({
      name: "",
      description: "",
      tags: "",
      isPublic: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
          {file && (
            <button
              type="button"
              onClick={handleClearFile}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
              ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={allowedTypes.join(",")}
              disabled={uploading}
            />
            
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 p-3 rounded-full bg-gray-100">
                {getFileIcon()}
              </div>
              
              {file ? (
                <div className="text-center">
                  <p className="mt-1 text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    Drag and drop a file, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: {maxSize}MB
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Image Preview */}
          <AnimatePresence>
            {preview && showPreview && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-auto max-h-48 object-contain"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* File Metadata */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={metadata.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="2"
                    value={metadata.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated, optional)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={metadata.tags}
                    onChange={handleInputChange}
                    placeholder="e.g. report, document, project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={metadata.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={uploading}
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this file accessible to others
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Upload Progress */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      Uploading...
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className={`px-4 py-2 rounded-md text-white font-medium 
                ${!file || uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                } transition-colors flex items-center`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Uploading...
                </>
              ) : uploadProgress === 100 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploader; 