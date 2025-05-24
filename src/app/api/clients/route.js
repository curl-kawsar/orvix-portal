import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/models/Client";
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
    const search = searchParams.get('search');
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch clients
    const clients = await Client.find(query).sort({ name: 1 });
    
    // Format clients for response
    const formattedClients = clients.map(client => ({
      id: client._id,
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
      status: client.status
    }));
    
    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { message: "Error fetching clients", error: error.message },
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
    
    const clientData = await request.json();
    
    // Validate required fields
    if (!clientData.name || !clientData.email) {
      return NextResponse.json(
        { message: "Client name and email are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check for duplicate email
    const existingClient = await Client.findOne({ email: clientData.email });
    if (existingClient) {
      return NextResponse.json(
        { message: "A client with this email already exists" },
        { status: 400 }
      );
    }
    
    // Create client
    const newClient = new Client({
      ...clientData,
      createdBy: auth.user._id
    });
    
    await newClient.save();
    
    return NextResponse.json(
      { message: "Client created successfully", client: newClient },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { message: "Error creating client", error: error.message },
      { status: 500 }
    );
  }
} 