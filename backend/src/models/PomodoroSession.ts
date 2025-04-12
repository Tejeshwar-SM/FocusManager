import mongoose, { Document, Schema } from "mongoose";
// import { createDeflate } from "zlib";
//session status of the timer
export enum SessionStatus {
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

export interface IPomodoroSession extends Document {
  user: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: SessionStatus;
  type: SessionType;
  taskId?: mongoose.Types.ObjectId;
  completedCycles: number;
  createdAt: Date;
  updatedAt: Date;
}

//pomodoro session schema
const PomodoroSessionSchema = new Schema<IPomodoroSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.IN_PROGRESS,
    },
    type: { type: String, enum: Object.values(SessionType), required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: false },
    completedCycles: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PomodoroSessionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IPomodoroSession>(
  "PomodoroSession",
  PomodoroSessionSchema
);
