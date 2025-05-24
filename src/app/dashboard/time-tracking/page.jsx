"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  Play,
  Pause,
  StopCircle,
  BarChart2,
  Filter,
  Plus,
  X,
  Trash2,
  Edit,
  Search,
  Briefcase,
  CheckSquare,
  Loader2
} from "lucide-react";

export default function TimeTrackingPage() {
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [filter, setFilter] = useState({
    project: "all",
    date: "week",
    status: "all"
  });

  // Fetch time entries, projects, and tasks on page load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch time entries
        const entriesResponse = await fetch('/api/time-entries');
        if (!entriesResponse.ok) throw new Error('Failed to fetch time entries');
        const entriesData = await entriesResponse.json();
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects?fields=name,_id');
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsResponse.json();
        
        setTimeEntries(entriesData.entries || []);
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load time tracking data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect to update elapsed time
  useEffect(() => {
    let interval;

    if (timerRunning && activeTimer) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerRunning, activeTimer]);

  // Start a new timer
  const startTimer = async (projectId, taskId, description) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          taskId,
          description,
          startTime: new Date().toISOString(),
          status: 'running'
        }),
      });

      if (!response.ok) throw new Error('Failed to start timer');
      
      const data = await response.json();
      setActiveTimer(data.entry);
      setTimerRunning(true);
      setElapsedTime(0);
      toast.success('Timer started');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  // Stop the active timer
  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/time-entries/${activeTimer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          status: 'completed',
          duration: activeTimer.duration + elapsedTime
        }),
      });

      if (!response.ok) throw new Error('Failed to stop timer');
      
      const data = await response.json();
      setTimeEntries(prev => [...prev.filter(entry => entry._id !== activeTimer._id), data.entry]);
      setActiveTimer(null);
      setTimerRunning(false);
      setElapsedTime(0);
      toast.success('Timer stopped');
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  // Pause the active timer
  const pauseTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/time-entries/${activeTimer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paused',
          duration: activeTimer.duration + elapsedTime
        }),
      });

      if (!response.ok) throw new Error('Failed to pause timer');
      
      const data = await response.json();
      setActiveTimer(data.entry);
      setTimerRunning(false);
      toast.success('Timer paused');
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause timer');
    }
  };

  // Resume a paused timer
  const resumeTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/time-entries/${activeTimer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'running'
        }),
      });

      if (!response.ok) throw new Error('Failed to resume timer');
      
      const data = await response.json();
      setActiveTimer(data.entry);
      setTimerRunning(true);
      toast.success('Timer resumed');
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Failed to resume timer');
    }
  };

  // Delete a time entry
  const deleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete entry');
      
      setTimeEntries(prev => prev.filter(entry => entry._id !== entryId));
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  // Show New Entry Form
  const NewEntryForm = () => {
    const [formData, setFormData] = useState({
      projectId: '',
      taskId: '',
      description: '',
      duration: '01:00:00'
    });
    const [projectTasks, setProjectTasks] = useState([]);
    const [fetchingTasks, setFetchingTasks] = useState(false);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));

      if (name === 'projectId' && value) {
        fetchTasksForProject(value);
      }
    };

    const fetchTasksForProject = async (projectId) => {
      if (!projectId) {
        setProjectTasks([]);
        return;
      }

      setFetchingTasks(true);
      try {
        const response = await fetch(`/api/tasks?projectId=${projectId}&fields=title,_id`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        
        const data = await response.json();
        setProjectTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setFetchingTasks(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Convert HH:MM:SS to seconds
      const [hours, minutes, seconds] = formData.duration.split(':').map(Number);
      const durationInSeconds = (hours * 3600) + (minutes * 60) + seconds;

      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: formData.projectId || undefined,
            taskId: formData.taskId || undefined,
            description: formData.description,
            duration: durationInSeconds,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + (durationInSeconds * 1000)).toISOString(),
            status: 'completed'
          }),
        });

        if (!response.ok) throw new Error('Failed to create time entry');
        
        const data = await response.json();
        setTimeEntries(prev => [...prev, data.entry]);
        setShowNewEntryForm(false);
        toast.success('Time entry created');
      } catch (error) {
        console.error('Error creating time entry:', error);
        toast.error('Failed to create time entry');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Time Entry</h3>
            <button onClick={() => setShowNewEntryForm(false)} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a project (optional)</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            {formData.projectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
                <select
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={fetchingTasks}
                >
                  <option value="">Select a task (optional)</option>
                  {projectTasks.map(task => (
                    <option key={task._id} value={task._id}>{task.title}</option>
                  ))}
                </select>
                {fetchingTasks && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Loading tasks...
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What did you work on?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (HH:MM:SS)</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="01:00:00"
              />
              <p className="text-xs text-gray-500 mt-1">Format: HH:MM:SS (e.g. 01:30:00 for 1 hour 30 minutes)</p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewEntryForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading time tracking data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your time on projects and tasks
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={filter.project}
              onChange={(e) => setFilter(prev => ({ ...prev, project: e.target.value }))}
              className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.name}</option>
              ))}
            </select>
          </div>
          
          {/* Time period filter */}
          <div className="relative">
            <select
              value={filter.date}
              onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
              className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {/* Add new entry button */}
          <button
            onClick={() => setShowNewEntryForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time
          </button>
        </div>
      </div>
      
      {/* Active Timer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Active Timer</h2>
        
        {activeTimer ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500 mb-1">
                {activeTimer.projectId && projects.find(p => p._id === activeTimer.projectId)?.name} 
                {activeTimer.description && ` - ${activeTimer.description}`}
              </p>
              <div className="text-3xl font-semibold text-gray-900">
                {formatTime(activeTimer.duration + elapsedTime)}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {timerRunning ? (
                <>
                  <button 
                    onClick={pauseTimer}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </button>
                  <button 
                    onClick={stopTimer}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={resumeTimer}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </button>
                  <button 
                    onClick={stopTimer}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">No active timer</p>
            
            <button 
              onClick={() => setShowNewEntryForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Timer
            </button>
          </div>
        )}
      </div>
      
      {/* Recent Time Entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Time Entries</h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Total: {formatTime(timeEntries.reduce((acc, entry) => acc + entry.duration, 0))}
            </div>
          </div>
        </div>
        
        {timeEntries.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No time entries yet</p>
            <p className="text-sm text-gray-500 mt-1">Start tracking your time by adding an entry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project/Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeEntries.map(entry => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.projectId ? (
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {projects.find(p => p._id === entry.projectId)?.name || 'Unknown Project'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No Project</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{entry.description || 'No description'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(entry.startTime).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatTime(entry.duration)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => deleteEntry(entry._id)}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Time Entry Form Modal */}
      {showNewEntryForm && <NewEntryForm />}
    </div>
  );
} 