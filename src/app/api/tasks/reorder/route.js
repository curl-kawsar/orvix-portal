import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import { authenticate } from "@/lib/auth";

// Reorder tasks or change status
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    const { taskId, sourceStatus, destinationStatus, newOrder } = await request.json();
    
    if (!taskId || !sourceStatus || !destinationStatus || newOrder === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the task to be moved
    const task = await Task.findById(taskId);
    
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }
    
    // Status change and reordering
    if (sourceStatus !== destinationStatus) {
      // Update all tasks in the destination status that need to move to make space
      await Task.updateMany(
        { 
          status: destinationStatus,
          order: { $gte: newOrder }
        },
        { $inc: { order: 1 } }
      );
      
      // If moving to a different status, update the task with new status and order
      task.status = destinationStatus;
      task.order = newOrder;
      await task.save();
      
      // Clean up the source status orders
      await Task.updateMany(
        { 
          status: sourceStatus, 
          order: { $gt: task.order }
        },
        { $inc: { order: -1 } }
      );
    } else {
      // Same column reordering
      const oldOrder = task.order;
      
      if (oldOrder < newOrder) {
        // Moving down - decrease order of tasks in between
        await Task.updateMany(
          { 
            status: sourceStatus,
            order: { $gt: oldOrder, $lte: newOrder }
          },
          { $inc: { order: -1 } }
        );
      } else if (oldOrder > newOrder) {
        // Moving up - increase order of tasks in between
        await Task.updateMany(
          { 
            status: sourceStatus,
            order: { $gte: newOrder, $lt: oldOrder }
          },
          { $inc: { order: 1 } }
        );
      }
      
      task.order = newOrder;
      await task.save();
    }
    
    return NextResponse.json({ 
      message: "Task reordered successfully",
      task: await Task.findById(taskId).populate({ path: 'assignee', select: 'name avatar', strictPopulate: false })
    });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { message: "Error reordering tasks", error: error.message },
      { status: 500 }
    );
  }
} 