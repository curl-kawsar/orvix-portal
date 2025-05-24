import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "@/lib/utils";

// Get a specific invoice by ID or invoice number
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
    await connectToDatabase();
    
    let invoice;
    
    // Check if it's a valid MongoDB ObjectId
    if (isValidObjectId(id)) {
      invoice = await Invoice.findById(id)
        .populate('client', 'name email company phone')
        .populate('project', 'name')
        .populate('createdBy', 'name email');
    } else {
      // If not a valid ObjectId, try to find by invoice number
      invoice = await Invoice.findOne({ invoiceNumber: id })
        .populate('client', 'name email company phone')
        .populate('project', 'name')
        .populate('createdBy', 'name email');
    }
    
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { message: "Error fetching invoice", error: error.message },
      { status: 500 }
    );
  }
}

// Update an invoice
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
    await connectToDatabase();
    
    let existingInvoice;
    
    // Check if it's a valid MongoDB ObjectId
    if (isValidObjectId(id)) {
      existingInvoice = await Invoice.findById(id);
    } else {
      // If not a valid ObjectId, try to find by invoice number
      existingInvoice = await Invoice.findOne({ invoiceNumber: id });
    }
    
    if (!existingInvoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }
    
    const invoiceData = await request.json();
    
    // Check for duplicate invoice number if it's being changed
    if (invoiceData.invoiceNumber && invoiceData.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber });
      if (duplicateInvoice) {
        return NextResponse.json(
          { message: "An invoice with this number already exists" },
          { status: 400 }
        );
      }
    }
    
    // If status changed to "paid", set payment date if not provided
    if (invoiceData.status === 'paid' && !invoiceData.paymentDate) {
      invoiceData.paymentDate = new Date();
    }
    
    // If status changed from "paid", clear payment date
    if (existingInvoice.status === 'paid' && invoiceData.status && invoiceData.status !== 'paid') {
      invoiceData.paymentDate = null;
    }
    
    // Update invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      existingInvoice._id,
      { ...invoiceData },
      { new: true, runValidators: true }
    )
    .populate('client', 'name email company phone')
    .populate('project', 'name');
    
    return NextResponse.json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { message: "Error updating invoice", error: error.message },
      { status: 500 }
    );
  }
}

// Delete an invoice
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
    await connectToDatabase();
    
    let deletedInvoice;
    
    // Check if it's a valid MongoDB ObjectId
    if (isValidObjectId(id)) {
      deletedInvoice = await Invoice.findByIdAndDelete(id);
    } else {
      // If not a valid ObjectId, try to find and delete by invoice number
      const invoice = await Invoice.findOne({ invoiceNumber: id });
      if (invoice) {
        deletedInvoice = await Invoice.findByIdAndDelete(invoice._id);
      }
    }
    
    if (!deletedInvoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Invoice deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { message: "Error deleting invoice", error: error.message },
      { status: 500 }
    );
  }
} 