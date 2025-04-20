
import { Request, Response } from "express";
import mongoose from "mongoose";
import PomodoroSession, {
  IPomodoroSession,
  SessionStatus,
  SessionType, // Make sure SessionType enum is imported/available
} from "../models/PomodoroSession"; // Adjust path if needed
import { updateLeaderboardForUser } from "./LeaderboardController";

//start a new pomodoro session
export const startSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Destructure all expected fields from body
    const { duration, type, taskId } = req.body;

    // Validate required fields
    if (!duration || duration < 1) {
      res.status(400).json({ success: false, message: "Duration is required and must be at least 1" });
      return;
    }
    if (!type || !Object.values(SessionType).includes(type)) {
      res.status(400).json({ success: false, message: "Valid session type ('focus', 'short', 'long') is required" });
      return;
    }

    // Construct session data
    const sessionData: Partial<IPomodoroSession> = {
      user: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      startTime: new Date(),
      duration,
      status: SessionStatus.IN_PROGRESS,
      completedCycles: 0,
      type: type as SessionType,
    };

    // Add taskId only if provided and valid (optional basic check)
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      sessionData.taskId = new mongoose.Types.ObjectId(taskId);
    } else if (taskId) {
      console.warn(`Invalid taskId format received: ${taskId}`); // Log invalid IDs
    }

    const session = await PomodoroSession.create(sessionData);

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
      user: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      status: SessionStatus.IN_PROGRESS,
    });

    if (!session) {
      res.status(404).json({ success: false, message: "Session not found or not in progress" });
      return;
    }

    session.status = SessionStatus.COMPLETED;
    session.endTime = new Date();
    // Only update cycles if provided, otherwise keep existing (though it starts at 0 now)
    if (req.body.completedCycles !== undefined) {
        session.completedCycles = Number(req.body.completedCycles); // Ensure it's a number
    }


    await session.save();
    if (req.user?.id) {
      await updateLeaderboardForUser(req.user.id);
    }
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
      res.status(404).json({ success: false, message: "Session not found or not in progress" });
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
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    let query = PomodoroSession.find({
      user: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
    })
    .sort({ startTime: -1 })
    .populate<{ taskId: { _id: string, title: string } }>('taskId', 'title');

    if(limit) {
        query = query.limit(limit);
    }

    const sessions = await query.exec();

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Couldn't get sessions", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Get stats (keep as is or refine if needed)
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    console.log("Stats requested with date param:", date);

    // Get today's date (midnight)
    const targetDate = date ? new Date(date as string) : new Date();

    // Reset time to start of day (midnight)
    targetDate.setHours(0, 0, 0, 0);

    // Create date for end of day (next day midnight)
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    console.log("Filtering sessions between:", targetDate, "and", nextDay);

    // Build match criteria to get COMPLETED FOCUS sessions for this user on the target date
    const matchCriteria = {
      user: new mongoose.Types.ObjectId(String(req.user?.id)),
      status: SessionStatus.COMPLETED,
      type: SessionType.FOCUS, // Only count focus time for daily stats
      startTime: { $gte: targetDate, $lt: nextDay }
    };

    // Get count of completed sessions
    const totalCompletedSessions = await PomodoroSession.countDocuments(matchCriteria);

    // Calculate total focus time using aggregation
    const focusTimeResult = await PomodoroSession.aggregate([
      { $match: matchCriteria },
      { $group: {
          _id: null,
          totalDuration: { $sum: "$duration" }
        }
      }
    ]);

    // Format the response data
    const stats = {
      totalCompletedSessions,
      totalFocusTime: focusTimeResult.length > 0 ? focusTimeResult[0].totalDuration : 0,
      date: targetDate.toISOString().split('T')[0] // Return the date we used for reference
    };

    console.log("Returning stats:", stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Couldn't get stats", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get daily focus time stats for the contribution graph
export const getDailyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }

    // Calculate the date range (e.g., last 365 days)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // Go back 364 days to get 365 days total
    startDate.setHours(0, 0, 0, 0); // Start of that day

    // Aggregate completed FOCUS sessions within the date range, grouped by day
    const dailyStats = await PomodoroSession.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: SessionStatus.COMPLETED,
          type: SessionType.FOCUS,
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: "UTC" }, // Group by date string YYYY-MM-DD in UTC
          },
          totalDuration: { $sum: "$duration" }, // Sum duration for each day
        },
      },
      {
        $project: {
          _id: 0, // Remove the default _id
          date: "$_id", // Rename _id to date
          totalDuration: 1,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date ascending
      },
    ]);

    res.json({
      success: true,
      data: dailyStats, // Returns an array like [{ date: "YYYY-MM-DD", totalDuration: number }]
    });
  } catch (error) {
    console.error("Couldn't get daily stats", error);
    res.status(500).json({ success: false, message: "Server Error fetching daily stats" });
  }
};


// **** REMOVE updateSession endpoint if it only updated task name ****
// If updateSession is used for other fields, keep it, but it's NOT needed for task linking anymore.
// export const updateSession = async(...) => { ... }