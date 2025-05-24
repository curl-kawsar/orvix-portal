import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
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
    const clientId = searchParams.get('client');
    const projectId = searchParams.get('project');
    const search = searchParams.get('search');
    const isPaid = searchParams.get('isPaid');
    const isOverdue = searchParams.get('isOverdue');
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (clientId) {
      query.client = clientId;
    }
    
    if (projectId) {
      query.project = projectId;
    }
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isPaid === 'true') {
      query.status = 'paid';
    }
    
    if (isOverdue === 'true') {
      query.status = 'overdue';
    }
    
    // Fetch invoices
    const invoices = await Invoice.find(query)
      .populate('client', 'name email')
      .populate('project', 'name')
      .sort({ issuedDate: -1 });
    
    // Format invoices for response
    const formattedInvoices = invoices.map(invoice => {
      return {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        client: {
          id: invoice.client?._id || 'unknown',
          name: invoice.client?.name || 'Unknown Client',
          email: invoice.client?.email || ''
        },
        project: {
          id: invoice.project?._id || 'unknown',
          name: invoice.project?.name || 'Unknown Project'
        },
        issuedDate: invoice.issuedDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        total: invoice.total,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod,
        createdAt: invoice.createdAt
      };
    });
    
    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { message: "Error fetching invoices", error: error.message },
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
    
    const invoiceData = await request.json();
    
    // Validate required fields
    if (!invoiceData.client || !invoiceData.project || !invoiceData.invoiceNumber || !invoiceData.dueDate || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        { message: "Missing required invoice fields" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check for duplicate invoice number
    const existingInvoice = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber });
    if (existingInvoice) {
      return NextResponse.json(
        { message: "An invoice with this number already exists" },
        { status: 400 }
      );
    }
    
    // Create invoice
    const newInvoice = new Invoice({
      ...invoiceData,
      createdBy: auth.user._id
    });
    
    await newInvoice.save();
    
    // Populate client and project data
    await newInvoice.populate('client', 'name email');
    await newInvoice.populate('project', 'name');
    
    return NextResponse.json(
      { message: "Invoice created successfully", invoice: newInvoice },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { message: "Error creating invoice", error: error.message },
      { status: 500 }
    );
  }
} 