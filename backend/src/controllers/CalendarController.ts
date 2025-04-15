import { Request, Response } from "express";
import mongoose from "mongoose";
import Task from "../models/Task";
import PomodoroSession, { SessionStatus } from "../models/PomodoroSession";

// Get all calendar events (tasks and sessions) within a date range
export const getCalendarEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse date range from query params
    const { start, end } = req.query;

    if (!start || !end) {
      res
        .status(400)
        .json({ success: false, message: "Start and end dates are required" });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid date format" });
      return;
    }

    // Get tasks with due dates in the range
    const tasks = await Task.find({
      user: req.user?.id,
      dueDate: { $gte: startDate, $lte: endDate },
    });

    // Get pomodoro sessions in the range
    const sessions = await PomodoroSession.find({
      user: req.user?.id,
      $or: [
        // Session starts within range
        { startTime: { $gte: startDate, $lte: endDate } },
        // Session ends within range
        { endTime: { $gte: startDate, $lte: endDate } },
        // Session starts before range and ends after range (spans the entire range)
        { startTime: { $lte: startDate }, endTime: { $gte: endDate } },
      ],
      status: { $ne: SessionStatus.CANCELLED }, // Exclude cancelled sessions
    }).populate("taskId", "title");

    // Format the response
    const events = {
      tasks: tasks.map((task) => ({
        id: task._id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        description: task.description,
        status: task.status,
        priority: task.priority,
        type: "task",
      })),
      sessions: sessions.map((session) => ({
        id: session._id,
        title: session.taskId
          ? (session.taskId as any).title || "Focus Session"
          : "Focus Session",
        start: session.startTime,
        end:
          session.endTime ||
          new Date(session.startTime.getTime() + session.duration * 60000),
        allDay: false,
        status: session.status,
        type: "session",
      })),
    };

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
