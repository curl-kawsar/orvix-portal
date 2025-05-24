"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  ClipboardList, 
  UserCircle, 
  FileText,
  Search,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // For demo purposes, we'll simulate search results
        // In a real app, this would be an API call like:
        // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock search results for demonstration
        const mockResults = [
          {
            id: 1,
            type: 'project',
            title: 'Website Redesign',
            description: 'Complete overhaul of client website with new branding',
            icon: <Briefcase className="h-5 w-5 text-blue-500" />,
            url: '/dashboard/projects/1',
            highlight: `Website <mark class="bg-yellow-100 px-1 rounded">Redesign</mark> project for XYZ Corp`
          },
          {
            id: 2,
            type: 'task',
            title: 'Update Homepage Banner',
            description: 'Replace current banner with new seasonal promotion',
            icon: <ClipboardList className="h-5 w-5 text-purple-500" />,
            url: '/dashboard/tasks/2',
            highlight: `Task to <mark class="bg-yellow-100 px-1 rounded">update</mark> the homepage elements`
          },
          {
            id: 3,
            type: 'client',
            title: 'Acme Corporation',
            description: 'Technology client based in New York',
            icon: <UserCircle className="h-5 w-5 text-green-500" />,
            url: '/dashboard/clients/3',
            highlight: `Client profile for <mark class="bg-yellow-100 px-1 rounded">${query}</mark> Corp`
          },
          {
            id: 4,
            type: 'document',
            title: 'Project Requirements',
            description: 'Detailed specifications for the upcoming project',
            icon: <FileText className="h-5 w-5 text-amber-500" />,
            url: '/dashboard/documents/4',
            highlight: `Document containing project <mark class="bg-yellow-100 px-1 rounded">requirements</mark> and specifications`
          }
        ];

        // Filter results based on search query
        const filteredResults = mockResults.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) || 
          item.description.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filteredResults);
        setError(null);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setError("Failed to fetch search results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link 
          href="/dashboard" 
          className="mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
      </div>
      
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <div className="mb-6">
          <div className="flex items-center">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-lg text-gray-800">
              {query ? (
                <>
                  Results for <span className="font-medium">"{query}"</span>
                </>
              ) : (
                "Enter a search term to find results"
              )}
            </p>
          </div>
          {results.length > 0 && !isLoading && (
            <p className="text-sm text-gray-500 mt-1">Found {results.length} results</p>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">
            {error}
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {results.map((result, index) => (
              <motion.li
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="py-4"
              >
                <Link href={result.url} className="flex items-start space-x-4 hover:bg-gray-50 p-3 rounded-lg transition-colors">
                  <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900">
                      {result.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.description}
                    </p>
                    <p 
                      className="text-xs text-gray-500 mt-2"
                      dangerouslySetInnerHTML={{ __html: result.highlight }}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {result.type}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        ) : query ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find anything matching "{query}". Try using different or more general keywords.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Start searching</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Use the search box at the top of the page to find projects, tasks, clients, and more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 