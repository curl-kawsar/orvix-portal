import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Add a comment to a task
export async function POST(request, { params }) {
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

    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { message: "Comment text is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Find task and add comment
    const task = await Task.findById(id);
    
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    // Add the comment
    task.comments.push({
      user: auth.user._id,
      text: text.trim(),
      createdAt: new Date()
    });
    
    await task.save();
    
    // Return the updated task with populated comment user data
    const updatedTask = await Task.findById(id)
      .populate({ path: 'assignee', select: 'name email avatar', strictPopulate: false })
      .populate({ path: 'project', select: 'name', strictPopulate: false })
      .populate({ path: 'comments.user', select: 'name avatar', strictPopulate: false });
    
    return NextResponse.json({
      message: "Comment added successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { message: "Error adding comment", error: error.message },
      { status: 500 }
    );
  }
} 