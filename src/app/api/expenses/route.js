import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { authenticate } from "@/lib/auth";
import { checkRole } from "@/lib/auth";

export async function GET(request) {
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

    await connectToDatabase();
    
    // Get search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch expenses
    const expenses = await Expense.find(query)
      .populate('project', 'name')
      .populate('recordedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1 });
    
    // Format expenses for response
    const formattedExpenses = expenses.map(expense => {
      return {
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
    });
    
    return NextResponse.json(formattedExpenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { message: "Error fetching expenses", error: error.message },
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

    // Verify permissions
    if (!checkRole(auth.user, ["admin", "finance", "manager"])) {
      return NextResponse.json(
        { message: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const expenseData = await request.json();
    
    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // For security, set the recordedBy to the current user
    expenseData.recordedBy = auth.user._id;
    
    // Create new expense
    const newExpense = new Expense(expenseData);
    await newExpense.save();
    
    // Populate references for response
    await newExpense.populate('project', 'name');
    await newExpense.populate('recordedBy', 'name');
    
    return NextResponse.json(
      { 
        message: "Expense created successfully", 
        expense: {
          id: newExpense._id,
          description: newExpense.description,
          amount: newExpense.amount,
          date: newExpense.date,
          category: newExpense.category,
          paymentMethod: newExpense.paymentMethod,
          status: newExpense.status,
          project: newExpense.project ? {
            id: newExpense.project._id,
            name: newExpense.project.name
          } : null,
          recordedBy: newExpense.recordedBy ? {
            id: newExpense.recordedBy._id,
            name: newExpense.recordedBy.name
          } : null,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { message: "Error creating expense", error: error.message },
      { status: 500 }
    );
  }
} 