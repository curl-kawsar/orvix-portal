"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Tag,
  AlertCircle,
  User,
  CheckCircle2,
  Clock,
  MoreVertical,
  Loader2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

// Status columns configuration
const statusColumns = [
  { id: "todo", name: "To Do", color: "bg-gray-200", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "in-progress", name: "In Progress", color: "bg-blue-200", icon: <Clock className="h-4 w-4" /> },
  { id: "review", name: "In Review", color: "bg-yellow-200", icon: <User className="h-4 w-4" /> },
  { id: "done", name: "Done", color: "bg-green-200", icon: <CheckCircle2 className="h-4 w-4" /> }
];

// Priority badge styles
const priorityStyles = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function TasksPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState({
    todo: [],
    "in-progress": [],
    review: [],
    done: []
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}${filterPriority ? `&priority=${filterPriority}` : ''}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      const allTasks = await response.json();
      
      // Group tasks by status
      const groupedTasks = {
        todo: [],
        "in-progress": [],
        review: [],
        done: []
      };
      
      allTasks.forEach(task => {
        if (groupedTasks[task.status]) {
          groupedTasks[task.status].push(task);
        } else {
          // Default to todo if status is not recognized
          groupedTasks.todo.push({...task, status: 'todo'});
        }
      });
      
      setTasks(groupedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  // Handle drag and drop between columns
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list or no movement
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    
    // Create optimistic update
    const sourceTasksCopy = [...tasks[sourceStatus]];
    const taskToMove = sourceTasksCopy.find(task => task._id === draggableId);
    
    if (!taskToMove) return;
    
    // Remove task from source
    const newSourceTasks = tasks[sourceStatus].filter(task => task._id !== draggableId);
    
    // Add task to destination
    let newDestinationTasks = [];
    
    if (sourceStatus === destinationStatus) {
      // Same column reordering
      newDestinationTasks = [...newSourceTasks];
      newDestinationTasks.splice(destination.index, 0, taskToMove);
    } else {
      // Different column
      const updatedTask = {...taskToMove, status: destinationStatus};
      newDestinationTasks = [...tasks[destinationStatus]];
      newDestinationTasks.splice(destination.index, 0, updatedTask);
    }
    
    // Update UI immediately for better user experience
    setTasks(prev => ({
      ...prev,
      [sourceStatus]: newSourceTasks,
      [destinationStatus]: newDestinationTasks
    }));
    
    // Send the update to the server
    try {
      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: draggableId,
          sourceStatus,
          destinationStatus,
          newOrder: destination.index
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
      
      toast.success(`Task moved to ${statusColumns.find(col => col.id === destinationStatus)?.name}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status");
      
      // Rollback the UI change if server update failed
      setTasks(prev => ({
        ...prev,
        [sourceStatus]: [...tasks[sourceStatus]],
        [destinationStatus]: [...tasks[destinationStatus]]
      }));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track project tasks
          </p>
        </div>
        <Link
          href="/dashboard/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setTimeout(fetchTasks, 100);
            }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map(column => (
              <div key={column.id} className="bg-white rounded-lg shadow">
                <div className={`px-4 py-2 rounded-t-lg ${column.color} flex justify-between items-center`}>
                  <div className="flex items-center">
                    {column.icon}
                    <h3 className="text-sm font-medium ml-2">{column.name}</h3>
                    <span className="ml-2 text-xs bg-white rounded-full px-2 py-0.5 font-medium">
                      {tasks[column.id].length}
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push(`/dashboard/tasks/new?status=${column.id}`)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`px-2 py-2 h-[calc(100vh-240px)] overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                    >
                      {tasks[column.id].length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-4 h-24 border-2 border-dashed border-gray-200 rounded-md">
                          <p className="text-sm text-gray-500">No tasks in this column</p>
                          <button 
                            onClick={() => router.push(`/dashboard/tasks/new?status=${column.id}`)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add Task
                          </button>
                        </div>
                      ) : (
                        tasks[column.id].map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 p-3 bg-white border rounded-md shadow-sm ${snapshot.isDragging ? 'shadow-md' : ''}`}
                                onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
                                  <div className="flex">
                                    <span className={`text-xs py-0.5 px-2 rounded-full ${priorityStyles[task.priority]}`}>
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                  </div>
                                </div>
                                {task.description && (
                                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                                )}
                                <div className="mt-2 flex justify-between items-center">
                                  <div className="flex items-center">
                                    {task.assignee ? (
                                      <div className="flex items-center">
                                        <div className="h-5 w-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                          {task.assignee.avatar ? (
                                            <img 
                                              src={task.assignee.avatar} 
                                              alt={task.assignee.name} 
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <User className="h-3 w-3 m-1 text-gray-500" />
                                          )}
                                        </div>
                                        <span className="ml-1 text-xs text-gray-500 truncate max-w-[80px]">
                                          {task.assignee.name}
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                  {task.dueDate && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {formatDate(task.dueDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
} 