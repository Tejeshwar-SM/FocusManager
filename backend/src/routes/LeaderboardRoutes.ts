import express from "express";
import { getLeaderboard, getUserRanking } from "../controllers/LeaderboardController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

// All routes are protected
router.use(protect);

// Get global leaderboard
router.get("/", getLeaderboard);

// Get current user's ranking
router.get("/me", getUserRanking);

export default router;