import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  issuedDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: [{
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'cash', 'paypal', 'other'],
  },
  paymentDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  terms: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
    },
    notes: {
      type: String,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }],
}, {
  timestamps: true,
});

// Add indexes for improved query performance
InvoiceSchema.index({ client: 1 }); // For client-based queries
InvoiceSchema.index({ status: 1 }); // For status-based filtering
InvoiceSchema.index({ dueDate: 1 }); // For due date queries
InvoiceSchema.index({ issueDate: 1 }); // For issue date queries
InvoiceSchema.index({ paymentDate: 1 }); // For payment date queries
InvoiceSchema.index({ createdBy: 1 }); // For creator-based queries
InvoiceSchema.index({ project: 1 }); // For project-based queries
InvoiceSchema.index({ 'items.service': 1 }); // For item service type queries
InvoiceSchema.index({ invoiceNumber: 1 }); // For invoice number lookups
InvoiceSchema.index({ status: 1, dueDate: 1 }); // For filtering by status and due date
InvoiceSchema.index({ client: 1, status: 1 }); // For client invoices by status
InvoiceSchema.index({ paymentDate: 1, status: 1 }); // For paid invoices by date

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

export default Invoice; 