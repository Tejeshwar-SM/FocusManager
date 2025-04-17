import { Request, Response } from "express";
import mongoose from "mongoose";
import Leaderboard from "../models/Leaderboard";
import User from "../models/User";
import PomodoroSession from "../models/PomodoroSession";
import { io } from "../server";
import { SessionStatus } from "../models/PomodoroSession";

// Get global leaderboard
export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period = "all", limit = 10 } = req.query;
    
    // Determine sort field based on period
    let sortField = "totalFocusTime";
    if (period === "weekly") sortField = "weeklyScore";
    if (period === "monthly") sortField = "monthlyScore";

    // Fetch leaderboard data with user details
    const leaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ [sortField]: -1 })
      .limit(Number(limit));

    // Add rank based on sorted results
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
};

// Get current user's ranking
export const getUserRanking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { period = "all" } = req.query;
    
    // Determine sort field based on period
    let sortField = "totalFocusTime";
    if (period === "weekly") sortField = "weeklyScore";
    if (period === "monthly") sortField = "monthlyScore";

    // Find the user's entry
    const userEntry = await Leaderboard.findOne({ user: userId }).populate(
      "user",
      "name email"
    );

    if (!userEntry) {
      res.status(404).json({
        success: false,
        error: "User not found in leaderboard"
      });
      return;
    }

    // Count how many users have higher scores
    const rank = await Leaderboard.countDocuments({
      [sortField]: { $gt: userEntry[sortField as keyof typeof userEntry] }
    });

    res.status(200).json({
      success: true,
      data: {
        ...userEntry.toObject(),
        rank: rank + 1
      }
    });
  } catch (error) {
    console.error("User ranking error:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
};

// Update leaderboard when session completes
export const updateLeaderboardForUser = async (
  userId: string
): Promise<void> => {
  try {
    // Calculate total focus time from all completed sessions
    const focusTimeResult = await PomodoroSession.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: SessionStatus.COMPLETED
        }
      },
      {
        $group: {
          _id: "$user",
          totalTime: { $sum: "$duration" },
          completedCount: { $sum: 1 }
        }
      }
    ]);

    // Get completed tasks count
    const taskCountResult = await mongoose.model("Task").countDocuments({
      user: userId,
      status: "completed"
    });

    // Calculate weekly and monthly scores
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyResult = await PomodoroSession.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: SessionStatus.COMPLETED,
          completedAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: "$user",
          weeklyTime: { $sum: "$duration" }
        }
      }
    ]);

    const monthlyResult = await PomodoroSession.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: SessionStatus.COMPLETED,
          completedAt: { $gte: oneMonthAgo }
        }
      },
      {
        $group: {
          _id: "$user",
          monthlyTime: { $sum: "$duration" }
        }
      }
    ]);

    const totalFocusTime = focusTimeResult.length > 0 ? focusTimeResult[0].totalTime : 0;
    const completedSessions = focusTimeResult.length > 0 ? focusTimeResult[0].completedCount : 0;
    const weeklyScore = weeklyResult.length > 0 ? weeklyResult[0].weeklyTime : 0;
    const monthlyScore = monthlyResult.length > 0 ? monthlyResult[0].monthlyTime : 0;

    // Update or create leaderboard entry
    await Leaderboard.findOneAndUpdate(
      { user: userId },
      {
        totalFocusTime,
        completedSessions,
        completedTasks: taskCountResult,
        weeklyScore,
        monthlyScore,
        lastUpdated: new Date()
      },
      {
        new: true,
        upsert: true
      }
    );

    // Emit updated leaderboard data
    emitLeaderboardUpdate();
  } catch (error) {
    console.error("Leaderboard update error:", error);
  }
};

// Function to emit leaderboard updates to all connected clients
export const emitLeaderboardUpdate = async (): Promise<void> => {
  try {
    // Get top leaderboard entries for each period
    const allTimeLeaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ totalFocusTime: -1 })
      .limit(10);

    const weeklyLeaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ weeklyScore: -1 })
      .limit(10);

    const monthlyLeaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ monthlyScore: -1 })
      .limit(10);

    // Add ranks
    const allTimeWithRanks = allTimeLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1
    }));

    const weeklyWithRanks = weeklyLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1
    }));

    const monthlyWithRanks = monthlyLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1
    }));

    // Emit to all connected clients
    io.emit("leaderboard-update", {
      allTime: allTimeWithRanks,
      weekly: weeklyWithRanks,
      monthly: monthlyWithRanks
    });
  } catch (error) {
    console.error("Error emitting leaderboard update:", error);
  }
};