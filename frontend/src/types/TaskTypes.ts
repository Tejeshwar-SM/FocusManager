// Types for Task-related data
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Types for Pomodoro-related data
export enum SessionStatus {
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface PomodoroSession {
  _id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  completedCycles: number;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
}
