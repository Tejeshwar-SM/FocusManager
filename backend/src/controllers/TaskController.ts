import { Request, Response } from "express";
import Task, { ITask, TaskStatus } from "../models/Task";

//get all tasks for a user
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ user: req.user?.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Couldn't get all tasks", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
//single task
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user?.id,
    });
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Couldn't find task", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getTaskStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get total tasks count
    const totalTasks = await Task.countDocuments({ user: req.user?.id });

    // Get completed tasks count
    const completedTasks = await Task.countDocuments({
      user: req.user?.id,
      status: TaskStatus.COMPLETED,
    });

    // Get tasks by priority
    const highPriorityTasks = await Task.countDocuments({
      user: req.user?.id,
      priority: "high",
    });

    const mediumPriorityTasks = await Task.countDocuments({
      user: req.user?.id,
      priority: "medium",
    });

    const lowPriorityTasks = await Task.countDocuments({
      user: req.user?.id,
      priority: "low",
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        remainingTasks: totalTasks - completedTasks,
        completionRate: totalTasks
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0,
        priorityDistribution: {
          high: highPriorityTasks,
          medium: mediumPriorityTasks,
          low: lowPriorityTasks,
        },
      },
    });
  } catch (error) {
    console.error("Error getting task stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//create a new task
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const task = await Task.create({
      user: req.user?.id,
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Couldn't create task", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//update
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, description, priority, dueDate } = req.body;

    //find the task, and ensure it belongs to the user
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user?.id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    //update fields
    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Update task error", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//delete a task
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user?.id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    // await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error("Delete task error", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//complete a task
export const completeTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user?.id,
    });
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    task.status = TaskStatus.COMPLETED;
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Complete task error", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
