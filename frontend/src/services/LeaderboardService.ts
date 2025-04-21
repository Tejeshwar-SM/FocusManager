import api from "./api";

/**
 * Service for interacting with the leaderboard API endpoints
 */
const LeaderboardService = {
  /**
   * Get global leaderboard with optional period filter
   * @param period - Timeframe for leaderboard data: "all", "weekly", or "daily"
   * @param limit - Maximum number of entries to return
   * @returns Promise with leaderboard data
   */
  getLeaderboard: (period = "all", limit = 10) => {
    return api.get(`/leaderboard?period=${period}&limit=${limit}`);
  },

  /**
   * Get current user's ranking on the leaderboard
   * @param period - Timeframe for ranking data: "all", "weekly", or "daily"
   * @returns Promise with user ranking data
   */
  getUserRanking: (period = "all") => {
    return api.get(`/leaderboard/me?period=${period}`);
  },
};

export default LeaderboardService;