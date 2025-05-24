"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
  Check,
  Clock,
  Briefcase,
  Users,
  RefreshCcw,
  Loader2,
  User,
  LinkIcon,
  ExternalLink,
  LayoutGrid,
  LayoutList
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, getHours, getMinutes, set } from "date-fns";

// Event component
const CalendarEvent = ({ event }) => {
  // Different styles based on event type
  const typeStyles = {
    task: "bg-indigo-100 text-indigo-800 border-indigo-200",
    meeting: "bg-amber-100 text-amber-800 border-amber-200",
    deadline: "bg-red-100 text-red-800 border-red-200",
    project: "bg-teal-100 text-teal-800 border-teal-200",
    reminder: "bg-violet-100 text-violet-800 border-violet-200"
  };
  
  const style = typeStyles[event.type] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className={`px-2 py-1 rounded-md text-xs truncate mb-1 border ${style}`}>
      <div className="font-medium truncate">{event.title}</div>
      {event.time && <div className="text-xs opacity-70">{event.time}</div>}
    </div>
  );
};

// Day cell component
const DayCell = ({ day, events, currentMonth, onAddEvent, onViewEvent }) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = isToday(day);
  const dayEvents = events.filter(event => isSameDay(parseISO(event.date), day));
  
  return (
    <div 
      className={`border border-gray-200 p-1 min-h-[100px] ${
        !isCurrentMonth ? "bg-gray-50" : "bg-white"
      } ${isCurrentDay ? "ring-2 ring-indigo-200" : ""}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-medium ${
          isCurrentDay 
            ? "bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center" 
            : !isCurrentMonth ? "text-gray-400" : "text-gray-700"
        }`}>
          {format(day, "d")}
        </span>
        <button 
          onClick={() => onAddEvent(day)}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[80px]">
        {dayEvents.map((event, idx) => (
          <div 
            key={idx} 
            onClick={() => onViewEvent(event)}
            className="cursor-pointer"
          >
            <CalendarEvent event={event} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Event form component
const EventForm = ({ selectedDate, onClose, onSave, editEvent }) => {
  const [formData, setFormData] = useState({
    title: editEvent?.title || "",
    date: editEvent ? format(parseISO(editEvent.date), "yyyy-MM-dd") : format(selectedDate, "yyyy-MM-dd"),
    time: editEvent?.time || "",
    type: editEvent?.type || "task",
    description: editEvent?.description || "",
    relatedProject: editEvent?.relatedProject || "",
    relatedTask: editEvent?.relatedTask || "",
    location: editEvent?.location || "",
    isAllDay: editEvent?.isAllDay || false
  });

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Fetch projects when the form opens
  useEffect(() => {
    async function fetchProjects() {
      setProjectsLoading(true);
      try {
        const response = await fetch('/api/projects?fields=name,_id');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Fetch tasks when a project is selected
  useEffect(() => {
    async function fetchTasks() {
      if (!formData.relatedProject) {
        setTasks([]);
        return;
      }

      setTasksLoading(true);
      try {
        const response = await fetch(`/api/tasks?projectId=${formData.relatedProject}&fields=title,_id`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setTasksLoading(false);
      }
    }

    if (formData.relatedProject) {
      fetchTasks();
    }
  }, [formData.relatedProject]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));

    // Clear related task when project changes
    if (name === 'relatedProject') {
      setFormData(prev => ({ ...prev, relatedTask: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {editEvent ? "Edit Event" : "Add Event"} - {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Event title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time {formData.isAllDay && "(All day)"}
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={formData.isAllDay}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${formData.isAllDay ? 'opacity-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAllDay"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
                All day event
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="task">Task</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="project">Project</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Project (optional)
            </label>
            <select
              name="relatedProject"
              value={formData.relatedProject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={projectsLoading}
            >
              <option value="">None</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            {projectsLoading && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading projects...
              </div>
            )}
          </div>

          {formData.relatedProject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Task (optional)
              </label>
              <select
                name="relatedTask"
                value={formData.relatedTask}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={tasksLoading}
              >
                <option value="">None</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {tasksLoading && (
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading tasks...
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add details"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700"
            >
              {editEvent ? "Update Event" : "Save Event"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Event detail view component
const EventDetailView = ({ event, onClose, onEdit, onDelete }) => {
  const [project, setProject] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch related project and task details if they exist
  useEffect(() => {
    async function fetchRelatedItems() {
      if (!event.relatedProject && !event.relatedTask) return;
      
      setLoading(true);
      try {
        if (event.relatedProject) {
          const projectResponse = await fetch(`/api/projects/${event.relatedProject}?fields=name,_id`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData.project);
          }
        }
        
        if (event.relatedTask) {
          const taskResponse = await fetch(`/api/tasks/${event.relatedTask}?fields=title,_id`);
          if (taskResponse.ok) {
            const taskData = await taskResponse.json();
            setTask(taskData.task);
          }
        }
      } catch (error) {
        console.error('Error fetching related items:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRelatedItems();
  }, [event.relatedProject, event.relatedTask]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Event Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Title</div>
            <div className="text-lg font-medium">{event.title}</div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Date</div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                <span>{format(parseISO(event.date), "MMMM d, yyyy")}</span>
              </div>
            </div>
            {event.time && (
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Time</div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{event.time}</span>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">Type</div>
            <div className="flex items-center">
              {event.type === "task" && <Check className="h-4 w-4 text-indigo-500 mr-1" />}
              {event.type === "meeting" && <Users className="h-4 w-4 text-amber-500 mr-1" />}
              {event.type === "deadline" && <Clock className="h-4 w-4 text-red-500 mr-1" />}
              {event.type === "project" && <Briefcase className="h-4 w-4 text-teal-500 mr-1" />}
              {event.type === "reminder" && <CalendarIcon className="h-4 w-4 text-violet-500 mr-1" />}
              <span className="capitalize">{event.type}</span>
            </div>
          </div>

          {event.location && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Location</div>
              <div className="text-sm">{event.location}</div>
            </div>
          )}
          
          {(event.relatedProject || event.relatedTask) && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Related Items</div>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                {loading ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading related items...
                  </div>
                ) : (
                  <>
                    {project && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{project.name}</span>
                        </div>
                        <a 
                          href={`/dashboard/projects/${project._id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                    {task && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{task.title}</span>
                        </div>
                        <a 
                          href={`/dashboard/tasks/${task._id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {event.description && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Description</div>
              <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">{event.description}</div>
            </div>
          )}
          
          <div className="pt-4 flex justify-end space-x-2">
            <button
              onClick={() => onDelete(event._id)}
              className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
            <button
              onClick={() => onEdit(event)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Weekly view time slot component
const WeeklyTimeSlot = ({ day, hour, events, onAddEvent }) => {
  const startTime = set(day, { hours: hour, minutes: 0, seconds: 0 });
  const endTime = set(day, { hours: hour + 1, minutes: 0, seconds: 0 });
  
  // Filter events for this time slot
  const timeSlotEvents = events.filter(event => {
    if (!event.time) return false;
    
    const eventDate = parseISO(event.date);
    if (!isSameDay(eventDate, day)) return false;
    
    const [eventHour, eventMinute] = event.time.split(':').map(Number);
    return eventHour === hour;
  });
  
  return (
    <div className="border-t border-l border-gray-200 p-1 min-h-[60px] relative">
      {timeSlotEvents.map((event, idx) => (
        <div 
          key={idx}
          className="absolute inset-0 m-1 overflow-hidden"
          style={{ 
            top: `${(getMinutes(parseISO(event.time)) / 60) * 100}%`,
            height: '95%'
          }}
        >
          <CalendarEvent event={event} />
        </div>
      ))}
      
      <button 
        onClick={() => {
          const newDate = set(day, { hours: hour });
          onAddEvent(newDate);
        }}
        className="absolute top-0 right-1 opacity-0 hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

// Weekly view day column component
const WeeklyDayColumn = ({ day, events, onAddEvent, onViewEvent }) => {
  const isCurrentDay = isToday(day);
  const dayEvents = events.filter(event => isSameDay(parseISO(event.date), day));
  
  // Filter all-day events
  const allDayEvents = dayEvents.filter(event => 
    event.isAllDay || !event.time
  );
  
  return (
    <div className="flex flex-col">
      {/* Day header */}
      <div 
        className={`py-2 text-center border-b border-gray-200 sticky top-0 z-10 ${
          isCurrentDay ? 'bg-indigo-50' : 'bg-gray-50'
        }`}
      >
        <div className={`text-xs font-medium ${
          isCurrentDay ? 'text-indigo-700' : 'text-gray-500'
        }`}>
          {format(day, 'EEE')}
        </div>
        <div className={`text-sm font-semibold ${
          isCurrentDay ? 'text-indigo-700' : 'text-gray-900'
        }`}>
          {format(day, 'd')}
        </div>
      </div>
      
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-1 border-b border-gray-200 max-h-[80px] overflow-y-auto">
          {allDayEvents.map((event, idx) => (
            <div 
              key={idx}
              onClick={() => onViewEvent(event)}
              className="cursor-pointer"
            >
              <CalendarEvent event={event} />
            </div>
          ))}
        </div>
      )}
      
      {/* Time slots */}
      {Array.from({ length: 24 }).map((_, hour) => (
        <WeeklyTimeSlot 
          key={hour}
          day={day}
          hour={hour}
          events={dayEvents}
          onAddEvent={onAddEvent}
        />
      ))}
    </div>
  );
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // "month" or "week"
  
  // Generate days for current month view
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Get days from previous month to fill first week
    let firstDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const prevMonthDays = firstDay > 0 ? firstDay : 0;
    
    const prevMonth = subMonths(start, 1);
    const prevMonthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - prevMonthDays + 1);
    
    // Get days from next month to fill last week
    const lastDay = end.getDay();
    const nextMonthDays = lastDay < 6 ? 6 - lastDay : 0;
    
    // Combine all days
    return eachDayOfInterval({
      start: prevMonthStart,
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate() + nextMonthDays)
    });
  }, [currentDate, viewMode]);
  
  // Generate days for current week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);
  
  // Get current month or week label
  const currentViewLabel = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      } else {
        return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
      }
    }
  }, [currentDate, viewMode]);
  
  // Fetch calendar events
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In month view, we fetch for the month
        // In week view, we fetch for the specific week
        let fetchUrl;
        if (viewMode === "month") {
          fetchUrl = `/api/calendar?month=${format(currentDate, 'yyyy-MM')}`;
        } else {
          const start = format(startOfWeek(currentDate), 'yyyy-MM-dd');
          const end = format(endOfWeek(currentDate), 'yyyy-MM-dd');
          fetchUrl = `/api/calendar?start=${start}&end=${end}`;
        }
        
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError(err.message);
        toast.error('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEvents();
  }, [currentDate, viewMode]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter(event => event.type === filter);
  }, [events, filter]);
  
  // Navigate to previous month or week
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(prevDate => subMonths(prevDate, 1));
    } else {
      setCurrentDate(prevDate => subWeeks(prevDate, 1));
    }
  };
  
  // Navigate to next month or week
  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(prevDate => addMonths(prevDate, 1));
    } else {
      setCurrentDate(prevDate => addWeeks(prevDate, 1));
    }
  };
  
  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Toggle view mode
  const handleToggleViewMode = () => {
    setViewMode(prevMode => prevMode === "month" ? "week" : "month");
  };
  
  // Open event form
  const handleAddEvent = (date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };
  
  // Open event form for editing
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setSelectedDate(parseISO(event.date));
    setShowEventForm(true);
    setShowEventDetail(false);
  };
  
  // View event details
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };
  
  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      setEvents(prev => prev.filter(event => event._id !== eventId));
      setShowEventDetail(false);
      toast.success('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
    }
  };
  
  // Save event - updated to handle both new and edited events
  const handleSaveEvent = async (eventData) => {
    try {
      const isEditing = !!selectedEvent;
      const method = isEditing ? 'PUT' : 'POST';
      
      // Clean up data for MongoDB compatibility
      const cleanedData = {
        ...eventData,
        // Only send relatedProject/Task if they have actual values
        relatedProject: eventData.relatedProject || undefined,
        relatedTask: eventData.relatedTask || undefined
      };
      
      const body = isEditing ? { ...cleanedData, _id: selectedEvent._id } : cleanedData;
      
      const response = await fetch('/api/calendar', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} event`);
      }
      
      const data = await response.json();
      
      if (isEditing) {
        setEvents(prev => prev.map(event => 
          event._id === selectedEvent._id ? data.event : event
        ));
      } else {
        setEvents(prev => [...prev, data.event]);
      }
      
      setShowEventForm(false);
      setSelectedEvent(null);
      toast.success(`Event ${isEditing ? 'updated' : 'added'} successfully`);
    } catch (err) {
      console.error(`Error ${selectedEvent ? 'updating' : 'saving'} event:`, err);
      toast.error(`Failed to ${selectedEvent ? 'update' : 'save'} event: ${err.message}`);
    }
  };
  
  // Loading state
  if (isLoading && events.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }
  
  // Error state
  if (error && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error loading calendar</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
              >
                <RefreshCcw className="inline-block mr-1 h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage events, meetings, and deadlines
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Month/Week navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
              {currentViewLabel}
            </div>
            <button
              onClick={handleNext}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* View toggle */}
          <button
            onClick={handleToggleViewMode}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {viewMode === "month" ? (
              <>
                <LayoutList className="h-4 w-4 mr-2" />
                Week View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Month View
              </>
            )}
          </button>
          
          {/* Today button */}
          <button
            onClick={handleToday}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Events</option>
              <option value="task">Tasks</option>
              <option value="meeting">Meetings</option>
              <option value="deadline">Deadlines</option>
              <option value="project">Projects</option>
              <option value="reminder">Reminders</option>
            </select>
          </div>
          
          {/* Add event button */}
          <button
            onClick={() => handleAddEvent(new Date())}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </button>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {viewMode === "month" ? (
          // Monthly view
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => (
                <DayCell
                  key={i}
                  day={day}
                  events={filteredEvents}
                  currentMonth={currentDate}
                  onAddEvent={handleAddEvent}
                  onViewEvent={handleViewEvent}
                />
              ))}
            </div>
          </>
        ) : (
          // Weekly view
          <div className="overflow-x-auto">
            <div className="min-w-[768px]">
              {/* Time indicators */}
              <div className="grid grid-cols-8 divide-x divide-gray-200">
                {/* Empty cell for the corner */}
                <div className="w-16 py-2 bg-gray-50 border-b border-gray-200"></div>
                
                {/* Day headers */}
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`py-2 text-center border-b border-gray-200 ${
                      isToday(day) ? 'bg-indigo-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${
                      isToday(day) ? 'text-indigo-700' : 'text-gray-500'
                    }`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isToday(day) ? 'text-indigo-700' : 'text-gray-900'
                    }`}>
                      {format(day, 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calendar body */}
              <div className="grid grid-cols-8 divide-x divide-gray-200 h-[600px] overflow-y-auto">
                {/* Time labels */}
                <div className="w-16">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div 
                      key={hour} 
                      className="h-[60px] border-t border-gray-200 text-xs text-gray-500 text-right pr-2 pt-0"
                    >
                      <div className="-mt-2.5 mr-1">{format(new Date().setHours(hour), 'h a')}</div>
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((day, idx) => (
                  <div key={idx} className="relative">
                    {/* All-day events */}
                    <div className="p-1 border-b border-gray-200 min-h-[40px] max-h-[80px] overflow-y-auto">
                      {filteredEvents
                        .filter(event => 
                          isSameDay(parseISO(event.date), day) && 
                          (event.isAllDay || !event.time)
                        )
                        .map((event, eventIdx) => (
                          <div 
                            key={eventIdx}
                            onClick={() => handleViewEvent(event)}
                            className="cursor-pointer"
                          >
                            <CalendarEvent event={event} />
                          </div>
                        ))
                      }
                    </div>
                    
                    {/* Time slots */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div 
                        key={hour}
                        className="h-[60px] border-t border-gray-200 relative"
                      >
                        {filteredEvents
                          .filter(event => {
                            if (!event.time || event.isAllDay) return false;
                            if (!isSameDay(parseISO(event.date), day)) return false;
                            
                            const [eventHour] = event.time.split(':').map(Number);
                            return eventHour === hour;
                          })
                          .map((event, eventIdx) => {
                            const [eventHour, eventMinute] = event.time.split(':').map(Number);
                            return (
                              <div 
                                key={eventIdx}
                                onClick={() => handleViewEvent(event)}
                                className="absolute left-0 right-0 mx-1 cursor-pointer z-10"
                                style={{ 
                                  top: `${(eventMinute / 60) * 100}%`,
                                  height: '55px'
                                }}
                              >
                                <CalendarEvent event={event} />
                              </div>
                            );
                          })
                        }
                        
                        {/* Add event button */}
                        <button 
                          onClick={() => {
                            const newDate = set(day, { hours: hour });
                            handleAddEvent(newDate);
                          }}
                          className="absolute top-0 right-1 opacity-0 hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Event color legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Event Types</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-200 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Tasks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-200 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Meetings</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-200 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Deadlines</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-200 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Projects</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-200 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Reminders</span>
          </div>
        </div>
      </div>
      
      {/* Event form modal */}
      {showEventForm && (
        <EventForm
          selectedDate={selectedDate}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
          onSave={handleSaveEvent}
          editEvent={selectedEvent}
        />
      )}
      
      {/* Event detail modal */}
      {showEventDetail && selectedEvent && (
        <EventDetailView
          event={selectedEvent}
          onClose={() => setShowEventDetail(false)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
} 