import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/models/Client";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

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
        { message: "Invalid client ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const client = await Client.findById(id);
    
    if (!client) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );
    }
    
    // Format client for response
    const formattedClient = {
      id: client._id,
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
      website: client.website,
      industry: client.industry,
      status: client.status,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
    
    return NextResponse.json(formattedClient);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { message: "Error fetching client", error: error.message },
      { status: 500 }
    );
  }
}

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
        { message: "Invalid client ID format" },
        { status: 400 }
      );
    }
    
    const clientData = await request.json();
    
    // Validate required fields
    if (!clientData.name || !clientData.email) {
      return NextResponse.json(
        { message: "Client name and email are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if trying to update to an existing email (that's not this client's)
    const existingClient = await Client.findOne({ 
      email: clientData.email,
      _id: { $ne: id }
    });
    
    if (existingClient) {
      return NextResponse.json(
        { message: "A client with this email already exists" },
        { status: 400 }
      );
    }
    
    // Update the client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        ...clientData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedClient) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Client updated successfully", 
        client: {
          id: updatedClient._id,
          name: updatedClient.name,
          email: updatedClient.email,
          company: updatedClient.company,
          phone: updatedClient.phone,
          website: updatedClient.website,
          industry: updatedClient.industry,
          status: updatedClient.status,
          notes: updatedClient.notes
        }
      }
    );
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { message: "Error updating client", error: error.message },
      { status: 500 }
    );
  }
}

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
        { message: "Invalid client ID format" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this client has any projects
    // This would require a Project model with a client field
    // Uncomment and modify as needed once you have a Project model
    /*
    const clientProjects = await Project.find({ client: id });
    if (clientProjects.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete client with active projects. Please reassign or delete the projects first." },
        { status: 400 }
      );
    }
    */
    
    const deletedClient = await Client.findByIdAndDelete(id);
    
    if (!deletedClient) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Client deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { message: "Error deleting client", error: error.message },
      { status: 500 }
    );
  }
} 