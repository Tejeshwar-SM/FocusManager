import { Request, Response } from "express";
import mongoose from "mongoose";
import PomodoroSession, {
  IPomodoroSession,
  SessionStatus,
} from "../models/PomodoroSession";

//start a new pomodoro session
export const startSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { duration } = req.body;

    if (!duration || duration < 1) {
      res.status(400).json({ success: false, message: "Duration is required" });
      return;
    }
    //duration cannot be less than 1 minute

    const session = await PomodoroSession.create({
      user: req.user?.id,
      startTime: new Date(),
      duration,
      status: SessionStatus.IN_PROGRESS,
      completedCycles: 0,
    });
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Couldn't start session", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//complete a pomodoro session
export const completeSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: req.params.id,
      user: req.user?.id,
      status: SessionStatus.IN_PROGRESS,
    });

    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    session.status = SessionStatus.COMPLETED;
    session.endTime = new Date();
    session.completedCycles =
      req.body.completedCycles || session.completedCycles;

    await session.save();

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Couldn't complete session", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//cancel a pomodoro session
export const cancelSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: req.params.id,
      user: req.user?.id,
      status: SessionStatus.IN_PROGRESS,
    });

    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    session.status = SessionStatus.CANCELLED;
    session.endTime = new Date();
    await session.save();

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Couldn't cancel session", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//get user's pomodoro sessions
export const getSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sessions = await PomodoroSession.find({
      user: req.user?.id,
    }).sort({ startTime: -1 });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Couldn't get sessions", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//get pomodoro statistics
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    //get total completed sessions
    const totalCompletedSessions = await PomodoroSession.countDocuments({
      user: req.user?.id,
      status: SessionStatus.COMPLETED,
    });
    //get total focus time in minutes
    const focusTimeResult = await PomodoroSession.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user?.id as string),
          status: SessionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$duration" },
          totalCycles: { $sum: "$completedCycles" },
        },
      },
    ]);

    const stats = {
      totalCompletedSessions,
      totalFocusTime:
        focusTimeResult.length > 0 ? focusTimeResult[0].totalDuration : 0,
      totalCycles:
        focusTimeResult.length > 0 ? focusTimeResult[0].totalCycles : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Couldn't get stats", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
