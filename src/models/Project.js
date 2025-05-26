import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Project start date is required'],
  },
  deadline: {
    type: Date,
    required: [true, 'Project deadline is required'],
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'review', 'completed', 'on-hold', 'cancelled'],
    default: 'planning',
  },
  budget: {
    type: Number,
    default: 0,
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  totalHoursLogged: {
    type: Number,
    default: 0,
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['project-manager', 'developer', 'designer', 'marketer', 'qa'],
    },
    hoursLogged: {
      type: Number,
      default: 0,
    },
    assignedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
  }],
  assets: [{
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['figma', 'github', 'document', 'image', 'other'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
  }],
  aiEstimates: {
    estimatedHours: Number,
    estimatedCost: Number,
    techRecommendations: [String],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: true,
});

// Add indexes for common query patterns ok
ProjectSchema.index({ status: 1 }); // For queries by status
ProjectSchema.index({ client: 1 }); // For queries by client
ProjectSchema.index({ deadline: 1 }); // For deadline-based queries
ProjectSchema.index({ 'teamMembers.user': 1 }); // For queries by team member
ProjectSchema.index({ isArchived: 1 }); // For filtering archived projects
ProjectSchema.index({ completionPercentage: 1 }); // For filtering by completion
ProjectSchema.index({ createdAt: 1 }); // For sorting by creation date
ProjectSchema.index({ updatedAt: 1 }); // For sorting by update date
ProjectSchema.index({ tags: 1 }); // For searching by tags
ProjectSchema.index({ status: 1, deadline: 1 }); // For combined status and deadline queries

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project; 
