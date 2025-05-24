import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
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

    // Only admin and finance roles can access finance data
    if (!checkRole(auth.user, ["admin", "finance"])) {
      return NextResponse.json(
        { message: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const invoiceStatus = searchParams.get('invoiceStatus');
    const expenseCategory = searchParams.get('expenseCategory');
    
    // Build invoice query
    let invoiceQuery = {};
    
    if (invoiceStatus) {
      invoiceQuery.status = invoiceStatus;
    }
    
    if (search) {
      invoiceQuery.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch invoices
    const invoices = await Invoice.find(invoiceQuery)
      .populate('client', 'name')
      .populate('project', 'name')
      .sort({ issuedDate: -1 });
    
    // Build expense query
    let expenseQuery = {};
    
    if (expenseCategory) {
      expenseQuery.category = expenseCategory;
    }
    
    if (search) {
      expenseQuery.$or = [
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch expenses
    const expenses = await Expense.find(expenseQuery)
      .populate('project', 'name')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });
    
    // Format invoices for response
    const formattedInvoices = invoices.map(invoice => {
      return {
        id: invoice.invoiceNumber,
        client: {
          id: invoice.client?._id || 'unknown',
          name: invoice.client?.name || 'Unknown Client'
        },
        project: {
          id: invoice.project?._id || 'unknown',
          name: invoice.project?.name || 'Unknown Project'
        },
        issuedDate: invoice.issuedDate,
        dueDate: invoice.dueDate,
        amount: invoice.total,
        status: invoice.status,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod
      };
    });
    
    // Format expenses for response
    const formattedExpenses = expenses.map(expense => {
      return {
        id: expense._id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        project: expense.project ? {
          id: expense.project._id,
          name: expense.project.name
        } : null,
        paymentMethod: expense.paymentMethod,
        status: expense.status,
        recordedBy: expense.recordedBy ? {
          id: expense.recordedBy._id,
          name: expense.recordedBy.name
        } : null
      };
    });
    
    // Calculate financial summary
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const outstandingInvoices = invoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue');
    
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const outstandingRevenue = outstandingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalRevenue - totalExpenses;
    
    // Format current date to find this month's data
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthInvoices = paidInvoices.filter(invoice => 
      invoice.paymentDate && new Date(invoice.paymentDate) >= firstDayOfMonth);
    
    const thisMonthExpenses = expenses.filter(expense => 
      expense.date && new Date(expense.date) >= firstDayOfMonth);
    
    const thisMonthRevenue = thisMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Get last month data
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthInvoices = paidInvoices.filter(invoice => 
      invoice.paymentDate && new Date(invoice.paymentDate) >= firstDayOfLastMonth && new Date(invoice.paymentDate) <= lastDayOfLastMonth);
    
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    return NextResponse.json({
      invoices: formattedInvoices,
      expenses: formattedExpenses,
      summary: {
        totalRevenue,
        outstandingRevenue,
        totalExpenses,
        profit,
        thisMonth: {
          revenue: thisMonthRevenue,
          expenses: thisMonthExpensesTotal,
          profit: thisMonthRevenue - thisMonthExpensesTotal
        },
        lastMonth: {
          revenue: lastMonthRevenue
        }
      }
    });
  } catch (error) {
    console.error("Error fetching finance data:", error);
    return NextResponse.json(
      { message: "Error fetching finance data", error: error.message },
      { status: 500 }
    );
  }
} 