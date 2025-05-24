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

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project; 