import { Request, Response } from "express";
import Task, { ITask, TaskStatus } from "../models/Task";
import { updateLeaderboardForUser } from "./LeaderboardController";

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
    const { title, description, priority, dueDate, estimatedTime } = req.body;
    
    const taskData: any = {
      user: req.user?.id,
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };
    
    // If estimatedTime is provided, set both estimated and remaining time
    if (estimatedTime !== undefined) {
      taskData.estimatedTime = Number(estimatedTime);
      taskData.remainingTime = Number(estimatedTime);
    }

    const task = await Task.create(taskData);

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
// Update the updateTask function to support all fields
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status, dueDate, estimatedTime } = req.body;

    // Find the task and ensure it belongs to the user
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user?.id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided in the request
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    // Handle estimated time - if changing, we need to adjust remaining time proportionally
    if (estimatedTime !== undefined) {
      // Convert to number to ensure proper handling
      const newEstimatedTime = Number(estimatedTime);
      
      // If there was a previous estimated time and remaining time
      if (task.estimatedTime !== undefined && task.remainingTime !== undefined) {
        // Calculate proportion of time remaining
        const completionRatio = Math.max(0, 1 - (task.remainingTime / task.estimatedTime));
        
        // Apply same completion ratio to new estimate (if ratio can be calculated)
        if (task.estimatedTime > 0) {
          updateData.estimatedTime = newEstimatedTime;
          updateData.remainingTime = Math.round(newEstimatedTime * (1 - completionRatio));
        } else {
          // If previous estimate was 0, just set both to the new value
          updateData.estimatedTime = newEstimatedTime;
          updateData.remainingTime = newEstimatedTime;
        }
      } else {
        // If no previous estimated/remaining time, set both to the new value
        updateData.estimatedTime = newEstimatedTime;
        updateData.remainingTime = newEstimatedTime;
      }
    }

    // Update the task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
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

export const updateTaskTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { completedTime } = req.body;
    
    if (typeof completedTime !== 'number' || completedTime <= 0) {
      res.status(400).json({ 
        success: false, 
        message: "Completed time must be a positive number" 
      });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user?.id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    // If task has no remaining time set but has estimated time, initialize it
    if (task.remainingTime === undefined && task.estimatedTime !== undefined) {
      task.remainingTime = task.estimatedTime;
    }

    // If task has a remaining time, subtract the completed time
    if (task.remainingTime !== undefined) {
      task.remainingTime = Math.max(0, task.remainingTime - completedTime);
    }

    await task.save();

    res.json({ 
      success: true, 
      data: task,
      timeRemaining: task.remainingTime,
      isComplete: task.remainingTime === 0
    });
  } catch (error) {
    console.error("Error updating task time:", error);
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
    // Update the leaderboard for the user
    if (req.user?.id) {
      await updateLeaderboardForUser(req.user.id);
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Complete task error", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
