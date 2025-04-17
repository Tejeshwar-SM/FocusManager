import api from "./api";
import { LeaderboardData, LeaderboardEntry } from "../types/types";

const LeaderboardService = {
  // Get global leaderboard with optional period filter
  getLeaderboard: (period?: string, limit?: number) => {
    return api.get("/leaderboard", {
      params: {
        period: period || "all",
        limit: limit || 10,
      },
    });
  },

  // Get current user's ranking
  getUserRanking: (period?: string) => {
    return api.get("/leaderboard/me", {
      params: { period: period || "all" },
    });
  },
};

export default LeaderboardService;
