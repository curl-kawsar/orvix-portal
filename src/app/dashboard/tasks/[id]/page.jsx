"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  MessageSquare,
  Flag,
  Tag,
  Briefcase,
  Loader2,
  Send,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comment, setComment] = useState("");
  const [users, setUsers] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
    fetchUsers();
  }, [taskId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Task not found");
          router.push("/dashboard/tasks");
          return;
        }
        throw new Error("Failed to fetch task details");
      }
      
      const data = await response.json();
      setTask(data);
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      
      toast.success("Task deleted successfully");
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (task.status === newStatus) return;
    
    try {
      // Optimistic update
      setTask(prev => ({...prev, status: newStatus}));
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
      
      toast.success(`Task moved to ${newStatus.replace('-', ' ')}`);
      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
      // Revert the optimistic update
      fetchTaskDetails();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: comment }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add comment");
      }
      
      const data = await response.json();
      setTask(data.task);
      setComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo': return <Clock className="h-4 w-4 mr-1" />;
      case 'in-progress': return <Clock className="h-4 w-4 mr-1" />;
      case 'review': return <Eye className="h-4 w-4 mr-1" />;
      case 'done': return <CheckCircle2 className="h-4 w-4 mr-1" />;
      default: return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  const getUserById = (userId) => {
    return users.find(user => user.id === userId) || null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Task not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The task you're looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/tasks"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Tasks
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
            href="/dashboard/tasks"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Tasks
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate max-w-2xl">{task.title}</h1>
          <span className={`px-3 py-1 inline-flex items-center text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            {task.status === 'in-progress' ? 'In Progress' : 
             task.status === 'todo' ? 'To Do' : 
             task.status === 'review' ? 'In Review' : 'Done'}
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/tasks/${taskId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Task Details</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                    {task.description || "No description provided"}
                  </dd>
                </div>
                {task.project && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      Project
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <Link href={`/dashboard/projects/${task.project._id}`} className="text-blue-600 hover:text-blue-800">
                        {task.project.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Flag className="h-4 w-4 mr-2 text-gray-400" />
                    Priority
                  </dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Due Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(task.dueDate) || "No due date set"}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDateTime(task.createdAt)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDateTime(task.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Comments</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {task.comments ? task.comments.length : 0}
              </span>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {task.comments && task.comments.length > 0 ? (
                <ul className="space-y-4">
                  {task.comments.map((comment, index) => (
                    <li key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {comment.user && comment.user.avatar ? (
                            <img 
                              src={comment.user.avatar} 
                              alt={comment.user.name} 
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {comment.user ? comment.user.name : "Unknown User"}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No comments yet</p>
                </div>
              )}

              <form onSubmit={handleAddComment} className="mt-6">
                <div>
                  <label htmlFor="comment" className="sr-only">Add a comment</label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submittingComment ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Status</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateStatus('todo')}
                  className={`px-3 py-2 text-sm rounded-md flex items-center justify-center ${
                    task.status === 'todo' 
                      ? 'bg-gray-100 text-gray-800 font-medium ring-2 ring-gray-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  To Do
                </button>
                <button
                  onClick={() => handleUpdateStatus('in-progress')}
                  className={`px-3 py-2 text-sm rounded-md flex items-center justify-center ${
                    task.status === 'in-progress' 
                      ? 'bg-blue-100 text-blue-800 font-medium ring-2 ring-blue-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus('review')}
                  className={`px-3 py-2 text-sm rounded-md flex items-center justify-center ${
                    task.status === 'review' 
                      ? 'bg-yellow-100 text-yellow-800 font-medium ring-2 ring-yellow-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  In Review
                </button>
                <button
                  onClick={() => handleUpdateStatus('done')}
                  className={`px-3 py-2 text-sm rounded-md flex items-center justify-center ${
                    task.status === 'done' 
                      ? 'bg-green-100 text-green-800 font-medium ring-2 ring-green-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assignee</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {task.assignee ? (
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {task.assignee.avatar ? (
                      <img 
                        src={task.assignee.avatar} 
                        alt={task.assignee.name} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{task.assignee.name}</h4>
                    {task.assignee.email && (
                      <p className="text-xs text-gray-500">{task.assignee.email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">No assignee</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Task</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 