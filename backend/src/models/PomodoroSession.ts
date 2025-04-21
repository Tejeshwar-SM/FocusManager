import mongoose, { Document, Schema } from "mongoose";

export enum SessionStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short_break",
  LONG_BREAK = "long_break"
}

export interface IPomodoroSession extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  duration: number;
  status: SessionStatus;
  taskId?: mongoose.Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  completedCycles?: number; // Added this field
  createdAt: Date;
  updatedAt: Date;
}

const PomodoroSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(SessionType),
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.PENDING,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    completedCycles: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for more efficient date-based queries
PomodoroSessionSchema.index({ userId: 1, status: 1 }); // Common query pattern
PomodoroSessionSchema.index({ startTime: 1 }); // For weekly/daily filters
PomodoroSessionSchema.index({ createdAt: 1 }); // For fallback date queries
PomodoroSessionSchema.index({ userId: 1, startTime: 1 }); // Combined index for user sessions by date
PomodoroSessionSchema.index({ userId: 1, createdAt: 1 }); // Combined index for user sessions by creation date

export default mongoose.model<IPomodoroSession>(
  "PomodoroSession",
  PomodoroSessionSchema
);