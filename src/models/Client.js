import mongoose from 'mongoose';

// Define the schema
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  communicationLogs: [{
    type: {
      type: String,
      enum: ['email', 'whatsapp', 'call', 'meeting', 'other'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachments: [{
      name: String,
      url: String,
    }],
  }],
  contactPersons: [{
    name: {
      type: String,
      required: true,
    },
    position: String,
    email: String,
    phone: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'former'],
    default: 'active'
  },
  tags: [{
    type: String,
  }],
  notes: {
    type: String
  },
}, {
  timestamps: true
});

// Add indexes for common query patterns
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ 'address.country': 1 });
clientSchema.index({ 'address.city': 1 });
clientSchema.index({ industry: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ 'communicationLogs.date': 1 });
clientSchema.index({ 'communicationLogs.type': 1 });
clientSchema.index({ 'communicationLogs.recordedBy': 1 });
clientSchema.index({ 'contactPersons.email': 1 });
clientSchema.index({ 'contactPersons.isPrimary': 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ createdAt: 1 });
clientSchema.index({ updatedAt: 1 });

// Compound indexes for common queries
clientSchema.index({ status: 1, industry: 1 });
clientSchema.index({ status: 1, 'address.country': 1 });
clientSchema.index({ status: 1, createdAt: 1 });

// Create the model if it doesn't exist
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export default Client; 