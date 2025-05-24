import mongoose from 'mongoose';

export const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ✅ Used in populate
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: Date,
  dueDate: Date,
  estimatedHours: {
    type: Number,
    default: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
  timeEntries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    duration: {
      type: Number,
      default: 0,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: false,
    },
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  attachments: [String],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  completedAt: Date,
  isArchived: {
    type: Boolean,
    default: false,
  },
  labels: [String],
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// ✅ Useful Indexes
TaskSchema.index({ status: 1, project: 1 });
TaskSchema.index({ assignee: 1 });

// ✅ Avoid model overwrite issue in hot-reload (Next.js/Dev mode)
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;
