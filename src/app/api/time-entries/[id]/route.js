import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import TimeEntry from "@/models/TimeEntry";

// GET handler - fetch a specific time entry
export async function GET(request, { params }) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const entryId = params.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Find the time entry
    const entry = await TimeEntry.findById(entryId).lean();
    
    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to view this entry
    if (entry.creator.toString() !== auth.user._id) {
      return NextResponse.json(
        { message: "You don't have permission to view this time entry" },
        { status: 403 }
      );
    }
    
    // Transform MongoDB document for client-side use
    const formattedEntry = {
      ...entry,
      _id: entry._id.toString(),
      projectId: entry.projectId ? entry.projectId.toString() : null,
      taskId: entry.taskId ? entry.taskId.toString() : null,
      creator: entry.creator.toString()
    };
    
    return NextResponse.json({ entry: formattedEntry });
  } catch (error) {
    console.error("Error fetching time entry:", error);
    return NextResponse.json(
      { message: "Error fetching time entry", error: error.message },
      { status: 500 }
    );
  }
}

// PUT handler - update a time entry
export async function PUT(request, { params }) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const entryId = params.id;
    const body = await request.json();
    
    // Connect to database
    await connectToDatabase();
    
    // Find the time entry
    const entry = await TimeEntry.findById(entryId);
    
    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this entry
    if (entry.creator.toString() !== auth.user._id) {
      return NextResponse.json(
        { message: "You don't have permission to update this time entry" },
        { status: 403 }
      );
    }
    
    // Update fields
    const allowedFields = [
      'projectId', 'taskId', 'description', 'startTime', 'endTime',
      'duration', 'status', 'billable', 'tags'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        entry[field] = body[field];
      }
    });
    
    // Save updated entry
    await entry.save();
    
    // Transform MongoDB document for client-side use
    const updatedEntry = {
      ...entry.toObject(),
      _id: entry._id.toString(),
      projectId: entry.projectId ? entry.projectId.toString() : null,
      taskId: entry.taskId ? entry.taskId.toString() : null,
      creator: entry.creator.toString()
    };
    
    return NextResponse.json({
      message: "Time entry updated successfully",
      entry: updatedEntry
    });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { message: "Error updating time entry", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler - delete a time entry
export async function DELETE(request, { params }) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const entryId = params.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Find the time entry
    const entry = await TimeEntry.findById(entryId);
    
    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete this entry
    if (entry.creator.toString() !== auth.user._id) {
      return NextResponse.json(
        { message: "You don't have permission to delete this time entry" },
        { status: 403 }
      );
    }
    
    // Delete the entry
    await entry.deleteOne();
    
    return NextResponse.json({
      message: "Time entry deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { message: "Error deleting time entry", error: error.message },
      { status: 500 }
    );
  }
} 