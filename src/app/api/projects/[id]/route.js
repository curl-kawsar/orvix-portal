import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific project by ID
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
        { message: "Invalid project ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const project = await Project.findById(id)
      .populate('client', 'name email company phone')
      .populate({
        path: 'teamMembers.user',
        select: 'name email avatar'
      });
    
    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }
    
    // Format team members for response
    const formattedProject = {
      id: project._id,
      name: project.name,
      description: project.description,
      client: {
        id: project.client?._id || 'unknown',
        name: project.client?.name || 'Unknown Client',
        email: project.client?.email,
        company: project.client?.company,
        phone: project.client?.phone
      },
      startDate: project.startDate,
      deadline: project.deadline,
      status: project.status,
      budget: project.budget,
      estimatedHours: project.estimatedHours,
      totalHoursLogged: project.totalHoursLogged,
      completionPercentage: project.completionPercentage,
      teamMembers: project.teamMembers.map(member => ({
        id: member.user?._id || member._id,
        name: member.user?.name || 'Unknown User',
        email: member.user?.email,
        avatar: member.user?.avatar || null,
        role: member.role,
        hoursLogged: member.hoursLogged
      })),
      assets: project.assets,
      isArchived: project.isArchived,
      tags: project.tags,
      aiEstimates: project.aiEstimates,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
    
    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { message: "Error fetching project", error: error.message },
      { status: 500 }
    );
  }
}

// Update a project
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
        { message: "Invalid project ID format" },
        { status: 400 }
      );
    }
    
    const projectData = await request.json();
    
    await connectToDatabase();
    
    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }
    
    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { ...projectData },
      { new: true, runValidators: true }
    )
    .populate('client', 'name email company phone')
    .populate({
      path: 'teamMembers.user',
      select: 'name email avatar'
    });
    
    return NextResponse.json({
      message: "Project updated successfully",
      project: updatedProject
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { message: "Error updating project", error: error.message },
      { status: 500 }
    );
  }
}

// Delete a project
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
        { message: "Invalid project ID format" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const deletedProject = await Project.findByIdAndDelete(id);
    
    if (!deletedProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Project deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { message: "Error deleting project", error: error.message },
      { status: 500 }
    );
  }
} 