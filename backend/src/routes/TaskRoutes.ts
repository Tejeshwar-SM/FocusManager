import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  // completeTask, // Removed - This function doesn't exist in the controller
  getTaskStats,
  updateTaskTime,
} from "../controllers/TaskController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

// All routes are protected = require authentication
router.use(protect);

// Get all tasks/events and create a task/event
router.route("/").get(getTasks).post(createTask);

// IMPORTANT: Put specific routes BEFORE parametric routes
router.get("/stats", getTaskStats); // Stats endpoint for tasks

// Add route for updating task time (relevant only for type 'task')
router.route("/:id/update-time").put(updateTaskTime);

// Removed the specific /complete route
// router.route("/:id/complete").put(completeTask);
// To complete a task, use the standard PUT /:id route with { status: 'completed' }

// Get, update, and delete a specific task/event
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

export default router;