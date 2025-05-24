import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import CalendarEvent from "@/models/CalendarEvent";
import mongoose from "mongoose";

// Generate some sample events for testing
async function generateSampleEvents(month, userId) {
  const date = parseISO(month + "-01");
  const monthName = format(date, "MMMM");
  
  const sampleEvents = [
    {
      title: `${monthName} Team Meeting`,
      date: `${month}-05`,
      time: "10:00",
      type: "meeting",
      description: "Weekly team sync"
    },
    {
      title: `${monthName} Project Deadline`,
      date: `${month}-15`,
      time: "",
      type: "deadline",
      description: "Complete phase 1 of the project"
    },
    {
      title: `${monthName} Client Presentation`,
      date: `${month}-20`,
      time: "14:00",
      type: "meeting",
      description: "Present project progress to client"
    },
    {
      title: `${monthName} Review Designs`,
      date: `${month}-08`,
      time: "",
      type: "task",
      description: "Review and approve new UI designs"
    },
    {
      title: `${monthName} Quarterly Planning`,
      date: `${month}-25`,
      time: "09:00",
      type: "project",
      description: "Plan for next quarter's projects"
    },
    {
      title: `${monthName} Follow up with Marketing`,
      date: `${month}-12`,
      time: "",
      type: "reminder",
      description: "Check on campaign progress"
    }
  ];
  
  // Create sample events in the database
  for (const eventData of sampleEvents) {
    const event = new CalendarEvent({
      ...eventData,
      creator: userId
    });
    await event.save();
  }
}

// GET handler - fetch events for a specific month or date range
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
    const month = searchParams.get("month"); // Format: YYYY-MM
    const startDate = searchParams.get("start"); // Format: YYYY-MM-DD
    const endDate = searchParams.get("end"); // Format: YYYY-MM-DD
    
    // Connect to database
    await connectToDatabase();
    
    let query = {};
    
    // Build query based on parameters
    if (month) {
      // Validate month parameter
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json(
          { message: "Invalid month parameter. Format should be YYYY-MM" },
          { status: 400 }
        );
      }
      
      // Get start and end dates for the month
      const [year, monthNum] = month.split("-").map(Number);
      const monthStartDate = `${month}-01`;
      const monthEndDate = `${month}-${new Date(year, monthNum, 0).getDate()}`;
      
      query.date = { $gte: monthStartDate, $lte: monthEndDate };
    } else if (startDate && endDate) {
      // Validate date range parameters
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json(
          { message: "Invalid date parameters. Format should be YYYY-MM-DD" },
          { status: 400 }
        );
      }
      
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      return NextResponse.json(
        { message: "Missing required parameters. Either 'month' or 'start' and 'end' are required." },
        { status: 400 }
      );
    }
    
    // Add user filter - show events created by user or where user is an attendee
    query.$or = [
      { creator: auth.user._id },
      { attendees: auth.user._id }
    ];
    
    // Find events matching the query
    let events = await CalendarEvent.find(query).lean();
    
    // If no events found and querying by month, generate sample data if this is the user's first time
    if (events.length === 0 && month) {
      // Check if there are any events at all for this user
      const totalEvents = await CalendarEvent.countDocuments({
        creator: auth.user._id
      });
      
      if (totalEvents === 0) {
        // Only generate sample data if the user has no events at all
        await generateSampleEvents(month, auth.user._id);
        
        // Fetch the newly created events
        events = await CalendarEvent.find(query).lean();
      }
    }
    
    // Transform MongoDB _id to string for client-side use
    events = events.map(event => ({
      ...event,
      _id: event._id.toString(),
    }));
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { message: "Error fetching calendar events", error: error.message },
      { status: 500 }
    );
  }
}

// POST handler - create a new event
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
    if (!body.title || !body.date || !body.type) {
      return NextResponse.json(
        { message: "Missing required fields: title, date, type" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Clean up data - convert empty strings to null for ObjectId fields
    const cleanedData = {
      ...body,
      relatedProject: body.relatedProject || null,
      relatedTask: body.relatedTask || null,
      creator: auth.user._id
    };
    
    // Create new event
    const newEvent = new CalendarEvent(cleanedData);
    
    // Save event to database
    await newEvent.save();
    
    // Convert MongoDB document to plain object and convert _id to string
    const event = {
      ...newEvent.toObject(),
      _id: newEvent._id.toString()
    };
    
    return NextResponse.json({ 
      message: "Event created successfully", 
      event
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { message: "Error creating calendar event", error: error.message },
      { status: 500 }
    );
  }
}

// PUT handler - update an existing event
export async function PUT(request) {
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
    
    // Validate event ID
    if (!body._id) {
      return NextResponse.json(
        { message: "Missing event ID" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find event
    const event = await CalendarEvent.findById(body._id);
    
    // Check if event exists
    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update
    if (event.creator.toString() !== auth.user._id) {
      return NextResponse.json(
        { message: "You don't have permission to update this event" },
        { status: 403 }
      );
    }
    
    // Clean body data - convert empty strings to null for ObjectId fields
    const cleanedBody = {
      ...body,
      relatedProject: body.relatedProject || null,
      relatedTask: body.relatedTask || null
    };
    
    // Update event fields
    Object.keys(cleanedBody).forEach(key => {
      if (key !== '_id' && key !== 'creator') {
        event[key] = cleanedBody[key];
      }
    });
    
    // Save updated event
    await event.save();
    
    // Convert MongoDB document to plain object and convert _id to string
    const updatedEvent = {
      ...event.toObject(),
      _id: event._id.toString()
    };
    
    return NextResponse.json({ 
      message: "Event updated successfully", 
      event: updatedEvent
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { message: "Error updating calendar event", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an event
export async function DELETE(request) {
  try {
    // Authenticate request
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    // Get event ID from query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");
    
    // Validate event ID
    if (!eventId) {
      return NextResponse.json(
        { message: "Missing event ID" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find event
    const event = await CalendarEvent.findById(eventId);
    
    // Check if event exists
    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete
    if (event.creator.toString() !== auth.user._id) {
      return NextResponse.json(
        { message: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }
    
    // Delete event
    await event.deleteOne();
    
    return NextResponse.json({ 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { message: "Error deleting calendar event", error: error.message },
      { status: 500 }
    );
  }
} 