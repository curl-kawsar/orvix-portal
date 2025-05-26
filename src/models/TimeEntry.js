import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ["running", "paused", "completed"],
      default: "running",
    },
    billable: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
TimeEntrySchema.index({ creator: 1 });
TimeEntrySchema.index({ projectId: 1 });
TimeEntrySchema.index({ taskId: 1 });
TimeEntrySchema.index({ startTime: 1 });
TimeEntrySchema.index({ status: 1 });

// Additional indexes for common query patterns
TimeEntrySchema.index({ endTime: 1 });
TimeEntrySchema.index({ billable: 1 });
TimeEntrySchema.index({ 'tags': 1 });
TimeEntrySchema.index({ createdAt: 1 });
TimeEntrySchema.index({ updatedAt: 1 });

// Compound indexes for common query combinations
TimeEntrySchema.index({ creator: 1, startTime: 1 });
TimeEntrySchema.index({ projectId: 1, creator: 1 });
TimeEntrySchema.index({ taskId: 1, creator: 1 });
TimeEntrySchema.index({ startTime: 1, endTime: 1 });
TimeEntrySchema.index({ creator: 1, status: 1 });
TimeEntrySchema.index({ creator: 1, billable: 1 });
TimeEntrySchema.index({ projectId: 1, billable: 1 });
TimeEntrySchema.index({ projectId: 1, startTime: 1, endTime: 1 });

// Calculate duration when saving if start and end time are provided
TimeEntrySchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.status === 'completed') {
    // Calculate duration in seconds
    const durationMs = new Date(this.endTime) - new Date(this.startTime);
    this.duration = Math.round(durationMs / 1000);
  }
  next();
});

// Define model if it doesn't exist yet
const TimeEntry = mongoose.models.TimeEntry || mongoose.model("TimeEntry", TimeEntrySchema);

export default TimeEntry; 