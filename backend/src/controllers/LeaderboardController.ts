import { Request, Response } from "express";
import mongoose from "mongoose";
import Leaderboard from "../models/Leaderboard";
import PomodoroSession from "../models/PomodoroSession";
import Task from "../models/Task";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { io } from "../server"; // Fixed import path to server.ts

/**
 * Get the leaderboard data based on period filter
 */
export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period = "all", limit = 10 } = req.query;
    const limitNum = Number(limit);

    let sortField: string;
    if (period === "weekly") {
      sortField = "weeklyScore";
    } else if (period === "daily") {
      sortField = "dailyScore";
    } else {
      sortField = "totalFocusTime";
    }

    // Get leaderboard data and populate user info
    const leaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ [sortField]: -1 })
      .limit(limitNum);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1,
    }));

    res.status(200).json({
      success: true,
      data: leaderboardWithRanks,
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get leaderboard data",
      error: (error as Error).message,
    });
  }
};

/**
 * Get the current user's ranking on the leaderboard
 */
export const getUserRanking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // @ts-ignore - Adding req.user from the auth middleware
    const userId = req.user?.id;
    const { period = "all" } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User ID not found in request",
      });
      return;
    }

    let sortField: string;
    if (period === "weekly") {
      sortField = "weeklyScore";
    } else if (period === "daily") {
      sortField = "dailyScore";
    } else {
      sortField = "totalFocusTime";
    }

    // Get all users sorted by the appropriate field
    const allUsers = await Leaderboard.find({}).sort({ [sortField]: -1 });

    // Find the user and their position in the rankings
    const userRank =
      allUsers.findIndex((entry) => entry.user.toString() === userId) + 1;

    // Get the user's leaderboard entry with user details
    const userEntry = await Leaderboard.findOne({ user: userId }).populate(
      "user",
      "name email"
    );

    if (!userEntry) {
      res.status(404).json({
        success: false,
        message: "User not found on leaderboard",
      });
      return;
    }

    // Add rank to user entry
    const userRanking = {
      ...userEntry.toObject(),
      rank: userRank || 0,
    };

    res.status(200).json({
      success: true,
      data: userRanking,
    });
  } catch (error) {
    console.error("Error getting user ranking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user ranking",
      error: (error as Error).message,
    });
  }
};

/**
 * Update the leaderboard data for a specific user
 * This is called when a session is completed/cancelled
 */
export const updateLeaderboardForUser = async (
  userId: string
): Promise<void> => {
  try {
    console.log(`Updating leaderboard for user: ${userId}`);
    
    // Get current date values for filtering
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    
    console.log(`Week range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
    console.log(`Day range: ${dayStart.toISOString()} to ${dayEnd.toISOString()}`);

    // Get all completed sessions for the user
    const sessions = await PomodoroSession.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "completed",
    });

    console.log(`Found ${sessions.length} completed sessions for user`);

    // Get all completed tasks for the user
    const completedTasks = await Task.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: "completed",
    });

    // Calculate total focus time (all time)
    const totalFocusTime = sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    console.log(`Total focus time: ${totalFocusTime} minutes`);

    // Calculate weekly score - sessions within this week
    const weeklyScore = sessions.reduce((sum, session) => {
      // Ensure we have a valid date object
      const sessionStartTime = session.startTime 
        ? new Date(session.startTime) 
        : new Date(session.createdAt);
        
      // Check if session is within this week's range
      if (isWithinInterval(sessionStartTime, { start: weekStart, end: weekEnd })) {
        return sum + session.duration;
      }
      return sum;
    }, 0);
    console.log(`Weekly score: ${weeklyScore} minutes`);

    // Calculate daily score - sessions from today
    const dailyScore = sessions.reduce((sum, session) => {
      // Ensure we have a valid date object
      const sessionStartTime = session.startTime 
        ? new Date(session.startTime) 
        : new Date(session.createdAt);
        
      // Check if session is within today's range
      if (isWithinInterval(sessionStartTime, { start: dayStart, end: dayEnd })) {
        return sum + session.duration;
      }
      return sum;
    }, 0);
    console.log(`Daily score: ${dailyScore} minutes`);

    // Find and update or create the leaderboard entry
    const updatedEntry = await Leaderboard.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          totalFocusTime,
          weeklyScore,
          dailyScore,
          completedSessions: sessions.length,
          completedTasks,
          lastUpdated: now,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`Leaderboard updated for user: ${userId}`);
    console.log(`Updated entry: ${JSON.stringify({
      totalFocusTime: updatedEntry.totalFocusTime,
      weeklyScore: updatedEntry.weeklyScore,
      dailyScore: updatedEntry.dailyScore,
    })}`);

    // Emit leaderboard update to all clients
    await emitLeaderboardUpdate();
  } catch (error) {
    console.error("Error updating leaderboard for user:", error);
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

    const dailyLeaderboard = await Leaderboard.find({})
      .populate("user", "name email")
      .sort({ dailyScore: -1 })
      .limit(10);

    // Add ranks
    const allTimeWithRanks = allTimeLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1,
    }));

    const weeklyWithRanks = weeklyLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1,
    }));

    const dailyWithRanks = dailyLeaderboard.map((entry, i) => ({
      ...entry.toObject(),
      rank: i + 1,
    }));

    // Log the data we're emitting
    console.log(`Emitting leaderboard update: 
      allTime entries: ${allTimeWithRanks.length}
      weekly entries: ${weeklyWithRanks.length}
      daily entries: ${dailyWithRanks.length}
    `);

    // Emit to all connected clients
    io.emit("leaderboardUpdate", {
      allTime: allTimeWithRanks,
      weekly: weeklyWithRanks,
      daily: dailyWithRanks,
    });
  } catch (error) {
    console.error("Error emitting leaderboard update:", error);
  }
};