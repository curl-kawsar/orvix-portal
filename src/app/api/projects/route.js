import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { authenticate } from "@/lib/auth";

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
    const search = searchParams.get('search');
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch projects with their related data
    const projects = await Project.find(query)
      .populate('client', 'name')
      .populate({
        path: 'teamMembers.user',
        select: 'name avatar'
      })
      .sort({ createdAt: -1 });
    
    // Format projects for response
    const formattedProjects = projects.map(project => {
      // Format team members
      const teamMembers = project.teamMembers.map(member => ({
        id: member.user?._id || member._id,
        name: member.user?.name || 'Unknown User',
        avatar: member.user?.avatar || null,
        role: member.role,
        hoursLogged: member.hoursLogged
      }));
      
      return {
        id: project._id,
        name: project.name,
        description: project.description,
        client: {
          id: project.client?._id || 'unknown',
          name: project.client?.name || 'Unknown Client'
        },
        startDate: project.startDate,
        deadline: project.deadline,
        status: project.status,
        budget: project.budget,
        completionPercentage: project.completionPercentage,
        teamMembers,
        estimatedHours: project.estimatedHours,
        totalHoursLogged: project.totalHoursLogged,
        isArchived: project.isArchived,
        tags: project.tags,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    });
    
    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Error fetching projects", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }
    
    const projectData = await request.json();
    
    // Validate required fields
    if (!projectData.name || !projectData.description || !projectData.client || !projectData.startDate || !projectData.deadline) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Create project
    const newProject = new Project({
      ...projectData,
      completionPercentage: 0,
      createdBy: auth.user._id
    });
    
    await newProject.save();
    
    return NextResponse.json(
      { message: "Project created successfully", project: newProject },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Error creating project", error: error.message },
      { status: 500 }
    );
  }
} 