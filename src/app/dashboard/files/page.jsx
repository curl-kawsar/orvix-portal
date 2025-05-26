"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Image, 
  Film, 
  Music, 
  FolderOpen,
  ShieldCheck
} from "lucide-react";
import FileUploader from "@/components/shared/FileUploader";
import FileBrowser from "@/components/shared/FileBrowser";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function FilesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Force refresh when tab changes
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [activeTab]);
  
  const handleUploadComplete = (file) => {
    // Refresh the file list when a new file is uploaded
    setRefreshTrigger(prev => prev + 1);
    
    // Switch to the appropriate tab based on file type
    if (file.fileType === "image") {
      setActiveTab("images");
    } else if (file.fileType === "document") {
      setActiveTab("documents");
    } else if (file.fileType === "video") {
      setActiveTab("videos");
    } else if (file.fileType === "audio") {
      setActiveTab("audio");
    } else {
      setActiveTab("all");
    }
    
    toast.success(`File "${file.name}" uploaded successfully`);
  };
  
  const handleFileDelete = (fileId) => {
    // Refresh the file list when a file is deleted
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleFileUpdate = (file) => {
    // Refresh the file list when a file is updated
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
        <p className="mt-2 text-lg text-gray-600">
          Upload, organize, and manage your files
          {isAdmin && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Admin Mode
            </span>
          )}
        </p>
        {isAdmin && (
          <p className="mt-1 text-sm text-gray-500">
            As an administrator, you can view, edit, and delete all files in the system.
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Panel */}
        <div className="lg:col-span-1">
          <FileUploader 
            onUploadComplete={handleUploadComplete}
            maxSize={10}
            showPreview={true}
          />
        </div>
        
        {/* File Browser Panel */}
        <div className="lg:col-span-2">
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 pt-4 border-b border-gray-200">
              <TabsList className="grid grid-cols-5 gap-2">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">All Files</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Images</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span className="hidden sm:inline">Audio</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              <FileBrowser 
                key={`all-${refreshTrigger}`}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
                showSearch={true}
                showFilters={true}
                className="border-none shadow-none rounded-none"
                filter={{}}
              />
            </TabsContent>
            
            <TabsContent value="images" className="m-0">
              <FileBrowser 
                key={`images-${refreshTrigger}`}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
                showSearch={true}
                showFilters={false}
                className="border-none shadow-none rounded-none"
                filter={{ fileType: "image" }}
              />
            </TabsContent>
            
            <TabsContent value="documents" className="m-0">
              <FileBrowser 
                key={`documents-${refreshTrigger}`}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
                showSearch={true}
                showFilters={false}
                className="border-none shadow-none rounded-none"
                filter={{ fileType: "document" }}
              />
            </TabsContent>
            
            <TabsContent value="videos" className="m-0">
              <FileBrowser 
                key={`videos-${refreshTrigger}`}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
                showSearch={true}
                showFilters={false}
                className="border-none shadow-none rounded-none"
                filter={{ fileType: "video" }}
              />
            </TabsContent>
            
            <TabsContent value="audio" className="m-0">
              <FileBrowser 
                key={`audio-${refreshTrigger}`}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
                showSearch={true}
                showFilters={false}
                className="border-none shadow-none rounded-none"
                filter={{ fileType: "audio" }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 