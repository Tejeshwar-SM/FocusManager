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

export enum CalendarEntryType {
  TASK = "task",
  EVENT = "event",
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  type: CalendarEntryType;
  priority: TaskPriority;
  status: TaskStatus;
  start: Date; // Required field from backend
  end?: Date; // Optional end time
  allDay?: boolean; // Indicates if it's an all-day entry
  dueDate?: string; // Legacy field - using start instead now
  estimatedTime?: number;
  remainingTime?: number;
  createdAt: string;
  updatedAt: string;
}

// Updated to match backend requirements
export interface TaskSubmission {
  title: string;
  description: string;
  priority: TaskPriority;
  type: CalendarEntryType;
  start: Date | string; // Required field for backend
  end?: Date | string; // Optional end time
  allDay?: boolean; // Default is false
  status?: TaskStatus;
  estimatedTime?: number;
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
  dailyScore: number;
  rank: number;
  lastUpdated: string;
}

export interface LeaderboardData {
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  daily: LeaderboardEntry[];
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
