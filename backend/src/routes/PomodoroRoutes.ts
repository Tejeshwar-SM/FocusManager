import express from "express";
import {
  startSession,
  completeSession,
  cancelSession,
  getSessions,
  getStats,
} from "../controllers/PomodoroSessionController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

// All routes are protected = require authentication
router.use(protect);

// Start a pomodoro session and get all sessions
router.route("/").post(startSession).get(getSessions);

// Get stats
router.get("/stats", getStats);

// Add dedicated route for completing a session (to match frontend expectation)
router.route("/:id/complete").put(completeSession);

// Original route: update or cancel a session
router.route("/:id").put(completeSession).delete(cancelSession);

export default router;
