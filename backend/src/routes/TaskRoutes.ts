import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTaskStats,
} from "../controllers/TaskController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

//all routes are protected= require authentication
router.use(protect);

//get all tasks and create a task
router.route("/").get(getTasks).post(createTask);

// IMPORTANT: Put specific routes BEFORE parametric routes
router.get("/stats", getTaskStats); // Stats endpoint COMES FIRST

//get, update, and delete a specific task
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

//complete a task
router.route("/:id/complete").put(completeTask);

export default router;
