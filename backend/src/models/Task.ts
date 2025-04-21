import mongoose, { Document, Schema } from "mongoose";

// Task priorities enum (relevant for type 'task')
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

// Task status enum (relevant for type 'task')
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
}

// Type of calendar entry
export enum CalendarEntryType {
  TASK = "task",
  EVENT = "event",
}

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: CalendarEntryType; // Differentiates between Task and Event
  
  // Fields for both types
  start: Date;          // Renamed from dueDate, required for both
  end?: Date;           // Optional end time (not relevant for allDay=true)
  allDay: boolean;      // Indicates if it's an all-day entry
  
  // Fields primarily for type 'task'
  priority?: TaskPriority; // Optional, relevant for tasks
  status?: TaskStatus;     // Optional, relevant for tasks
  estimatedTime?: number; 
  remainingTime?: number; 
  
  createdAt: Date;
  updatedAt: Date;
}

// Create Task Schema
const TaskSchema = new Schema<ITask>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(CalendarEntryType),
      required: true,
      default: CalendarEntryType.TASK, // Default to Task if not specified
    },
    start: {
      type: Date,
      required: [true, "Please provide a start date/time"],
    },
    end: {
      type: Date,
      // End date must be after start date if provided and not allDay
      validate: [
        function(this: ITask, value: Date | undefined): boolean {
          if (value && !this.allDay && this.start) {
            return value > this.start;
          }
          return true;
        },
        'End date must be after start date for non-all-day events.'
      ]
    },
    allDay: {
      type: Boolean,
      required: true,
      default: false,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      // Default only makes sense if type is 'task', handled in controller logic
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      // Default only makes sense if type is 'task', handled in controller logic
    },
    estimatedTime: {
      type: Number,
      min: 0,
    },
    remainingTime: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index for common queries
TaskSchema.index({ user: 1, start: 1 });
TaskSchema.index({ user: 1, end: 1 });
TaskSchema.index({ user: 1, type: 1 });

// Ensure end is unset if allDay is true
TaskSchema.pre('save', function(next) {
  if (this.isModified('allDay') && this.allDay) {
    this.end = undefined; 
  }
  // Set default priority/status if type is task and they are not set
  if (this.type === CalendarEntryType.TASK) {
    if (!this.priority) {
      this.priority = TaskPriority.MEDIUM;
    }
    if (!this.status) {
      this.status = TaskStatus.TODO;
    }
  } else {
    // Ensure task-specific fields are unset if type is event
    this.priority = undefined;
    this.status = undefined;
    this.estimatedTime = undefined;
    this.remainingTime = undefined;
  }
  next();
});

export default mongoose.model<ITask>("Task", TaskSchema);
