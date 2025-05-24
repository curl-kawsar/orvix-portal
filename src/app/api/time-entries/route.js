import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import TimeEntry from "@/models/TimeEntry";
import mongoose from "mongoose";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Generate sample time entries for new users
async function generateSampleTimeEntries(userId, projectIds) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sampleEntries = [
    {
      description: "Initial project setup",
      startTime: new Date(yesterday.setHours(9, 0, 0)),
      endTime: new Date(yesterday.setHours(11, 30, 0)),
      status: "completed",
    },
    {
      description: "Client meeting",
      startTime: new Date(yesterday.setHours(13, 0, 0)),
      endTime: new Date(yesterday.setHours(14, 0, 0)),
      status: "completed",
    },
    {
      description: "Documentation",
      startTime: new Date(now.setHours(10, 0, 0)),
      endTime: new Date(now.setHours(12, 30, 0)),
      status: "completed",
    }
  ];
  
  // Add project IDs if available
  if (projectIds && projectIds.length > 0) {
    sampleEntries[0].projectId = projectIds[0];
    if (projectIds.length > 1) {
      sampleEntries[1].projectId = projectIds[1];
      sampleEntries[2].projectId = projectIds[0];
    }
  }
  
  // Create sample entries in the database
  for (const entryData of sampleEntries) {
    const durationMs = new Date(entryData.endTime) - new Date(entryData.startTime);
    const duration = Math.round(durationMs / 1000);
    
    const entry = new TimeEntry({
      ...entryData,
      creator: userId,
      duration
    });
    await entry.save();
  }
}

// GET handler - fetch time entries with optional filters
export async function GET(request) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const status = searchParams.get("status");
    const period = searchParams.get("period"); // today, week, month
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Connect to database
    await connectToDatabase();
    
    // Build query based on parameters
    let query = { creator: auth.user._id };
    
    // Filter by project
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Filter by task
    if (taskId) {
      query.taskId = taskId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date period
    const now = new Date();
    if (period) {
      switch (period) {
        case "today":
          query.startTime = { 
            $gte: startOfDay(now),
            $lte: endOfDay(now)
          };
          break;
        case "week":
          query.startTime = { 
            $gte: startOfWeek(now),
            $lte: endOfWeek(now)
          };
          break;
        case "month":
          query.startTime = { 
            $gte: startOfMonth(now),
            $lte: endOfMonth(now)
          };
          break;
      }
    } 
    // Or filter by custom date range
    else if (startDate && endDate) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json(
          { message: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      
      query.startTime = { 
        $gte: startOfDay(parseISO(startDate)),
        $lte: endOfDay(parseISO(endDate))
      };
    }
    
    // Find time entries matching the query
    let entries = await TimeEntry.find(query)
      .sort({ startTime: -1 })
      .lean();
    
    // If no entries found, generate sample data for first-time users
    if (entries.length === 0) {
      // Check if there are any entries at all for this user
      const totalEntries = await TimeEntry.countDocuments({
        creator: auth.user._id
      });
      
      if (totalEntries === 0) {
        // Get some projects for sample data
        const Project = mongoose.models.Project;
        let projectIds = [];
        
        if (Project) {
          const projects = await Project.find({ creator: auth.user._id })
            .limit(2)
            .select("_id")
            .lean();
          
          projectIds = projects.map(p => p._id);
        }
        
        // Generate sample data
        await generateSampleTimeEntries(auth.user._id, projectIds);
        
        // Fetch the newly created entries
        entries = await TimeEntry.find(query)
          .sort({ startTime: -1 })
          .lean();
      }
    }
    
    // Transform MongoDB _id to string for client-side use
    entries = entries.map(entry => ({
      ...entry,
      _id: entry._id.toString(),
      projectId: entry.projectId ? entry.projectId.toString() : null,
      taskId: entry.taskId ? entry.taskId.toString() : null,
      creator: entry.creator.toString()
    }));
    
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { message: "Error fetching time entries", error: error.message },
      { status: 500 }
    );
  }
}

// POST handler - create a new time entry
export async function POST(request) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.startTime) {
      return NextResponse.json(
        { message: "Missing required field: startTime" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if there's already a running timer
    const runningEntry = await TimeEntry.findOne({
      creator: auth.user._id,
      status: "running"
    });
    
    if (runningEntry && body.status === "running") {
      return NextResponse.json(
        { message: "You already have a running timer" },
        { status: 400 }
      );
    }
    
    // Create new time entry
    const newEntry = new TimeEntry({
      ...body,
      creator: auth.user._id
    });
    
    // Save entry to database
    await newEntry.save();
    
    // Convert MongoDB document to plain object and convert _id to string
    const entry = {
      ...newEntry.toObject(),
      _id: newEntry._id.toString(),
      projectId: newEntry.projectId ? newEntry.projectId.toString() : null,
      taskId: newEntry.taskId ? newEntry.taskId.toString() : null,
      creator: newEntry.creator.toString()
    };
    
    return NextResponse.json({ 
      message: "Time entry created successfully", 
      entry
    });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { message: "Error creating time entry", error: error.message },
      { status: 500 }
    );
  }
} 