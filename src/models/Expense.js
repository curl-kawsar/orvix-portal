import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now,
  },
  category: {
    type: String,
    enum: ['salary', 'tools', 'hosting', 'marketing', 'office', 'travel', 'utilities', 'taxes', 'other'],
    required: [true, 'Expense category is required'],
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  receipt: {
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'company_card', 'other'],
    required: true,
  },
  notes: {
    type: String,
  },
  tags: [{
    type: String,
  }],
  monthlyRecurring: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

export default Expense; 