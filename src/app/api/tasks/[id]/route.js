import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific task by ID
export async function GET(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const task = await Task.findById(id)
      .populate({ path: 'assignee', select: 'name email avatar', strictPopulate: false })
      .populate({ path: 'project', select: 'name', strictPopulate: false })
      .populate({ path: 'comments.user', select: 'name avatar', strictPopulate: false });
    
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { message: "Error fetching task", error: error.message },
      { status: 500 }
    );
  }
}

// Update a task
export async function PUT(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID format" },
        { status: 400 }
      );
    }
    
    const taskData = await request.json();
    
    await connectToDatabase();
    
    // Find task and update
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      taskData,
      { new: true, runValidators: true }
    )
    .populate({ path: 'assignee', select: 'name email avatar', strictPopulate: false })
    .populate({ path: 'project', select: 'name', strictPopulate: false });
    
    if (!updatedTask) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Error updating task", error: error.message },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID format" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Task deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { message: "Error deleting task", error: error.message },
      { status: 500 }
    );
  }
} 