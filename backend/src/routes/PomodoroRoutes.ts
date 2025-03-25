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

//all routes are protected= require authentication
router.use(protect);

//start a pomodoro session and get all sessions
router.route("/").post(startSession).get(getSessions);

router.get("/stats", getStats);

//complete or cancel a session
router.route("/:id").put(completeSession).delete(cancelSession);

export default router;
