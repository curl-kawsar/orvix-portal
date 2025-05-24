"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    "draft": { color: "bg-gray-100 text-gray-800", icon: <FileText className="w-4 h-4 mr-1" /> },
    "sent": { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4 mr-1" /> },
    "paid": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4 mr-1" /> },
    "overdue": { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4 mr-1" /> },
    "cancelled": { color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-4 h-4 mr-1" /> },
  };

  const config = statusConfig[status] || statusConfig["draft"];
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${config.color}`}>
      {config.icon}
      {displayStatus}
    </span>
  );
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "-";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Financial summary component
function FinancialSummary({ summary }) {
  const { totalRevenue, outstandingRevenue, totalExpenses, profit, thisMonth } = summary;
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Revenue */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Outstanding</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(outstandingRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Expenses</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalExpenses)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Profit */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-md p-3`}>
              {profit >= 0 ? (
                <ArrowUp className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Profit</dt>
                <dd className={`text-lg font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [financeData, setFinanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (statusFilter && activeTab === "invoices") {
        params.append('invoiceStatus', statusFilter);
      } else if (statusFilter && activeTab === "expenses") {
        params.append('expenseCategory', statusFilter);
      }
      
      const response = await fetch(`/api/finance?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch finance data');
      }
      
      const data = await response.json();
      setFinanceData(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Re-fetch data when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchFinanceData();
    }
  }, [searchQuery, statusFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested values like client.name
      if (sortField.includes('.')) {
        const keys = sortField.split('.');
        aValue = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, a);
        bValue = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, b);
      }
      
      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      // Handle dates as strings
      if (sortField === 'issuedDate' || sortField === 'dueDate' || sortField === 'date') {
        const aDate = new Date(aValue || 0);
        const bDate = new Date(bValue || 0);
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      // Handle other values
      return sortDirection === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    });
  };

  const invoices = financeData?.invoices || [];
  const expenses = financeData?.expenses || [];
  const summary = financeData?.summary || {
    totalRevenue: 0,
    outstandingRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    thisMonth: {
      revenue: 0,
      expenses: 0,
      profit: 0
    }
  };

  const sortedInvoices = sortData(invoices);
  const sortedExpenses = sortData(expenses);

  // Filter displayed invoices based on search and status
  const filteredInvoices = sortedInvoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter displayed expenses based on search and category
  const filteredExpenses = sortedExpenses.filter(expense => {
    const matchesSearch = !searchQuery || 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !statusFilter || expense.category === statusFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="ml-4 text-xl font-medium text-gray-600">Loading finance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading finance data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <div className="flex space-x-2">
          {activeTab === "invoices" && (
            <Link href="/dashboard/invoices/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              New Invoice
            </Link>
          )}
          {activeTab === "expenses" && (
            <Link href="/dashboard/expenses/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              New Expense
            </Link>
          )}
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md inline-flex items-center text-sm font-medium"
            onClick={() => {/* Download logic */}}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Financial Summary */}
      <FinancialSummary summary={summary} />
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "invoices"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("invoices")}
          >
            Invoices
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "expenses"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </button>
        </nav>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
        <div className="relative rounded-md shadow-sm max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative inline-block text-left">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 text-gray-500" />
            <select
              className="bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All {activeTab === "invoices" ? "Statuses" : "Categories"}</option>
              
              {activeTab === "invoices" && (
                <>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
              
              {activeTab === "expenses" && (
                <>
                  <option value="salary">Salary</option>
                  <option value="tools">Tools</option>
                  <option value="hosting">Hosting</option>
                  <option value="marketing">Marketing</option>
                  <option value="office">Office</option>
                  <option value="travel">Travel</option>
                  <option value="utilities">Utilities</option>
                  <option value="taxes">Taxes</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
      
      {/* Table - Invoices */}
      {activeTab === "invoices" && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                  Invoice #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('client.name')}>
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('issuedDate')}>
                  Issued Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('dueDate')}>
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                        {invoice.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {invoice.client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(invoice.issuedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 italic">
                    No invoices found. {searchQuery || statusFilter ? "Try changing your filters." : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Table - Expenses */}
      {activeTab === "expenses" && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('description')}>
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('category')}>
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('paymentMethod')}>
                  Payment Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link href={`/dashboard/expenses/${expense.id}`} className="text-blue-600 hover:text-blue-900">
                        {expense.description}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {expense.paymentMethod.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 italic">
                    No expenses found. {searchQuery || statusFilter ? "Try changing your filters." : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 