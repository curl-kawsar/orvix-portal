import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { authenticate } from "@/lib/auth";
import { checkRole } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific expense by ID
export async function GET(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    // Verify permissions
    if (!checkRole(auth.user, ["admin", "finance", "manager"])) {
      return NextResponse.json(
        { message: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const expense = await Expense.findById(id)
      .populate('project', 'name')
      .populate('recordedBy', 'name')
      .populate('approvedBy', 'name');
    
    if (!expense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }
    
    // Format expense for response
    const formattedExpense = {
      id: expense._id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      category: expense.category,
      project: expense.project ? {
        id: expense.project._id,
        name: expense.project.name
      } : null,
      receipt: expense.receipt || null,
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      notes: expense.notes,
      tags: expense.tags,
      monthlyRecurring: expense.monthlyRecurring,
      recordedBy: expense.recordedBy ? {
        id: expense.recordedBy._id,
        name: expense.recordedBy.name
      } : null,
      approvedBy: expense.approvedBy ? {
        id: expense.approvedBy._id,
        name: expense.approvedBy.name
      } : null,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };
    
    return NextResponse.json(formattedExpense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { message: "Error fetching expense", error: error.message },
      { status: 500 }
    );
  }
}

// Update an expense
export async function PUT(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    // Verify permissions
    if (!checkRole(auth.user, ["admin", "finance"])) {
      return NextResponse.json(
        { message: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }
    
    const expenseData = await request.json();
    
    await connectToDatabase();
    
    // Check if expense exists
    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }
    
    // Handle approval status change
    if (expenseData.status === 'approved' && existingExpense.status !== 'approved') {
      expenseData.approvedBy = auth.user._id;
    }
    
    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { ...expenseData },
      { new: true, runValidators: true }
    )
    .populate('project', 'name')
    .populate('recordedBy', 'name')
    .populate('approvedBy', 'name');
    
    return NextResponse.json({
      message: "Expense updated successfully",
      expense: {
        id: updatedExpense._id,
        description: updatedExpense.description,
        amount: updatedExpense.amount,
        date: updatedExpense.date,
        category: updatedExpense.category,
        status: updatedExpense.status,
        paymentMethod: updatedExpense.paymentMethod,
        project: updatedExpense.project ? {
          id: updatedExpense.project._id,
          name: updatedExpense.project.name
        } : null,
        recordedBy: updatedExpense.recordedBy ? {
          id: updatedExpense.recordedBy._id,
          name: updatedExpense.recordedBy.name
        } : null,
        approvedBy: updatedExpense.approvedBy ? {
          id: updatedExpense.approvedBy._id,
          name: updatedExpense.approvedBy.name
        } : null,
      }
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { message: "Error updating expense", error: error.message },
      { status: 500 }
    );
  }
}

// Delete an expense
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: 401 }
      );
    }

    // Only admin and finance roles can delete expenses
    if (!checkRole(auth.user, ["admin", "finance"])) {
      return NextResponse.json(
        { message: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const deletedExpense = await Expense.findByIdAndDelete(id);
    
    if (!deletedExpense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Expense deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { message: "Error deleting expense", error: error.message },
      { status: 500 }
    );
  }
} 