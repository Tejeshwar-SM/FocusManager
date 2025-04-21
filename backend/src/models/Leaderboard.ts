import mongoose, { Document, Schema } from "mongoose";

export interface ILeaderboard extends Document {
  user: mongoose.Types.ObjectId;
  totalFocusTime: number; // in minutes
  completedSessions: number;
  completedTasks: number;
  weeklyScore: number;
  dailyScore: number; // Added daily score instead of monthlyScore
  lastUpdated: Date;
}

const LeaderboardSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalFocusTime: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    weeklyScore: {
      type: Number,
      default: 0,
    },
    dailyScore: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
LeaderboardSchema.index({ totalFocusTime: -1 });
LeaderboardSchema.index({ completedSessions: -1 });
LeaderboardSchema.index({ weeklyScore: -1 });
LeaderboardSchema.index({ dailyScore: -1 });

export default mongoose.model<ILeaderboard>("Leaderboard", LeaderboardSchema);