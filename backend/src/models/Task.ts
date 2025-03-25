import mongoose, { Document, Schema } from "mongoose";

//task priorities enum
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
//task status enum
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
}

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
//create Task Schema
const TaskSchema = new Schema<ITask>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a task title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ user: 1, status: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
