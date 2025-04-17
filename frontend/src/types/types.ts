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
  estimatedTime?: number; // Added: estimated time in minutes
  remainingTime?: number; // Added: remaining time in minutes
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
  taskName?: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LeaderboardEntry {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  totalFocusTime: number;
  completedSessions: number;
  completedTasks: number;
  weeklyScore: number;
  monthlyScore: number;
  rank: number;
  lastUpdated: string;
}

export interface LeaderboardData {
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
}

export interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryForm {
  title: string;
  content: string;
}