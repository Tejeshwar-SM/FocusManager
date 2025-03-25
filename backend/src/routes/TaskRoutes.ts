import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
} from "../controllers/TaskController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

//all routes are protected= require authentication
router.use(protect);

//test
// router.get("/test", (req, res) => {
//   res.send("Task route is working fine!");
// });

//get all tasks and create a task
router.route("/").get(getTasks).post(createTask);

//get, update, and delete a specific task
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

//complete a task
router.route("/:id/complete").put(completeTask);

export default router;
