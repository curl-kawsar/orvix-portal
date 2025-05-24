import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { authenticate } from "@/lib/auth";

// Get all tasks with filtering
export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get search params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assignee');
    const project = searchParams.get('project');
    const search = searchParams.get('search');
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (assignee) {
      query.assignee = assignee;
    }
    
    if (project) {
      query.project = project;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch tasks
    const tasks = await Task.find(query)
      .populate({ path: 'assignee', select: 'name avatar', strictPopulate: false })
      .populate({ path: 'project', select: 'name', strictPopulate: false })
      .sort({ order: 1, updatedAt: -1 });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { message: "Error fetching tasks", error: error.message },
      { status: 500 }
    );
  }
}

// Create new task
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const taskData = await request.json();
    
    // Validate required fields
    if (!taskData.title) {
      return NextResponse.json(
        { message: "Task title is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the highest order number in the same status column to place the new task at the end
    const maxOrderTask = await Task.findOne({ 
      status: taskData.status || 'todo',
      ...(taskData.project ? { project: taskData.project } : {})
    }).sort({ order: -1 });
    
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;
    
    // Create task
    const newTask = new Task({
      ...taskData,
      order,
      // Add the authenticated user as creator
      createdBy: auth.user._id,
      // Add the authenticated user as assignee if none specified
      assignee: taskData.assignee || auth.user._id
    });
    
    await newTask.save();
    
    // Populate assignee fields with strictPopulate: false
    await newTask.populate({ path: 'assignee', select: 'name avatar', strictPopulate: false });
    if (newTask.project) {
      await newTask.populate({ path: 'project', select: 'name', strictPopulate: false });
    }
    
    return NextResponse.json(
      { message: "Task created successfully", task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { message: "Error creating task", error: error.message },
      { status: 500 }
    );
  }
}

// Update task status (for kanban board)
export async function PATCH(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const { taskId, status } = await request.json();
    
    if (!taskId || !status) {
      return NextResponse.json(
        { message: "Task ID and status are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Update task status
    const task = await Task.findById(taskId);
    
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    // Update status
    task.status = status;
    
    // If task is marked as done, set completedAt
    if (status === 'done' && !task.completedAt) {
      task.completedAt = new Date();
    } 
    // If task was done but now not done, clear completedAt
    else if (status !== 'done' && task.completedAt) {
      task.completedAt = null;
    }
    
    await task.save();
    
    // Populate fields
    await task.populate({ path: 'assignee', select: 'name avatar', strictPopulate: false });
    if (task.project) {
      await task.populate({ path: 'project', select: 'name', strictPopulate: false });
    }
    
    return NextResponse.json({ message: "Task status updated successfully", task });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { message: "Error updating task status", error: error.message },
      { status: 500 }
    );
  }
} 