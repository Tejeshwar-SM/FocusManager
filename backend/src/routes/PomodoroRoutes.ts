import express from "express";
import {
  startSession,
  completeSession,
  cancelSession,
  getSessions,
  getStats,
  getDailyStats, // Import the new controller function
} from "../controllers/PomodoroSessionController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

// All routes are protected = require authentication
router.use(protect);

// Start a pomodoro session and get all sessions
router.route("/").post(startSession).get(getSessions);

// Get stats for a specific date (or today)
router.get("/stats", getStats);

// Get daily stats for the contribution graph (e.g., last year)
router.get("/daily-stats", getDailyStats); // Add the new route

// Add dedicated route for completing a session (to match frontend expectation)
router.route("/:id/complete").put(completeSession);

// Add dedicated route for cancelling a session
router.route("/:id/cancel").put(cancelSession); // Changed from delete to put to match frontend service

// Original route: update or cancel a session - REMOVED cancel from here as it has its own route now
// If update is needed for other fields, keep it, otherwise remove this route.
// For now, assuming only complete/cancel are needed via dedicated routes.
// router.route("/:id").put(updateSession); // Example if update is needed

export default router;