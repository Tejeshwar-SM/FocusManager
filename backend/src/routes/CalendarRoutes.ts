import express from "express";
import { getCalendarEvents } from "../controllers/CalendarController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

// All routes are protected
router.use(protect);

// Get events for calendar view
router.get("/events", getCalendarEvents);

export default router;
