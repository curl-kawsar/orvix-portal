import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, "Event date is required"],
    },
    time: {
      type: String, // Format: HH:MM
      default: "",
    },
    type: {
      type: String,
      enum: ["task", "meeting", "deadline", "project", "reminder"],
      required: [true, "Event type is required"],
      default: "task",
    },
    description: {
      type: String,
      default: "",
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      type: String, // "none", "daily", "weekly", "monthly", "yearly"
      default: "none",
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    color: {
      type: String,
      default: "",
    },
    notifications: [{
      type: {
        type: String,
        enum: ["email", "push", "inApp"],
      },
      time: {
        type: Number, // Minutes before event
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CalendarEventSchema.index({ date: 1 });
CalendarEventSchema.index({ creator: 1 });
CalendarEventSchema.index({ type: 1 });
CalendarEventSchema.index({ relatedProject: 1 });

// Add virtual for date objects
CalendarEventSchema.virtual("dateObj").get(function() {
  return this.date ? new Date(this.date) : null;
});

// Add method to check if event is in a specific month
CalendarEventSchema.methods.isInMonth = function(year, month) {
  if (!this.date) return false;
  
  // Parse the date (YYYY-MM-DD)
  const [eventYear, eventMonth] = this.date.split("-").map(Number);
  
  return eventYear === year && eventMonth === month;
};

// Define model if it doesn't exist yet
const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model("CalendarEvent", CalendarEventSchema);

export default CalendarEvent; 