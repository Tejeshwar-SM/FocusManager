import { Request, Response } from "express";
import Task, {
  ITask,
  CalendarEntryType,
  TaskStatus,
  TaskPriority,
} from "../models/Task"; // Import necessary types/enums
import mongoose from "mongoose";

// Get all tasks (can optionally filter by type, status, etc.)
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Example: Allow filtering by type if needed
    const filter: any = { user: req.user?.id };
    if (
      req.query.type &&
      Object.values(CalendarEntryType).includes(
        req.query.type as CalendarEntryType
      )
    ) {
      filter.type = req.query.type;
    }

    const tasks = await Task.find(filter).sort({ start: -1 }); // Sort by start date
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a single task or event by ID
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid ID format" });
      return;
    }

    const task = await Task.findOne({ _id: id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ success: false, message: "Entry not found" });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create a new task or event
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      type, // 'task' or 'event'
      start,
      end,
      allDay,
      priority, // Only for 'task'
      status, // Only for 'task'
      estimatedTime, // Only for 'task'
      // Add other relevant fields from your ITask interface
    } = req.body;

    // Basic validation
    if (!title || !type || !start) {
      res
        .status(400)
        .json({
          success: false,
          message: "Missing required fields (title, type, start)",
        });
      return;
    }

    if (!Object.values(CalendarEntryType).includes(type as CalendarEntryType)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid type specified" });
      return;
    }

    const newTaskData: Partial<ITask> = {
      user: new mongoose.Types.ObjectId(req.user?.id),
      title,
      description,
      type,
      start: new Date(start), // Ensure dates are Date objects
      allDay: allDay || false,
    };

    // Add end date if provided and not allDay
    if (end && !newTaskData.allDay) {
      newTaskData.end = new Date(end);
    } else {
      newTaskData.end = undefined; // Ensure end is undefined if allDay or not provided
    }

    // Add task-specific fields only if type is 'task'
    if (type === CalendarEntryType.TASK) {
      newTaskData.priority = priority || TaskPriority.MEDIUM; // Use default if not provided
      newTaskData.status = status || TaskStatus.TODO; // Use default if not provided
      newTaskData.estimatedTime = estimatedTime;
      // remainingTime could be set equal to estimatedTime initially
      if (estimatedTime !== undefined) {
        newTaskData.remainingTime = estimatedTime;
      }
    }

    const task = await Task.create(newTaskData);

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error creating task/event:", error);
    if (error.name === "ValidationError") {
      res
        .status(400)
        .json({
          success: false,
          message: "Validation Error",
          errors: error.errors,
        });
    } else {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

// Update an existing task or event
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid ID format" });
      return;
    }

    const task = await Task.findOne({ _id: id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ success: false, message: "Entry not found" });
      return;
    }

    // Use Object.assign and then save to trigger pre-save hooks
    // This ensures logic like clearing task fields if type changes to 'event' runs
    Object.assign(task, req.body);

    // Ensure date strings are converted back to Date objects if necessary
    if (req.body.start) task.start = new Date(req.body.start);
    if (req.body.end) task.end = new Date(req.body.end);
    // If allDay is explicitly set to true in the update, clear the end date
    if (req.body.allDay === true) task.end = undefined;
    // If allDay is set to false, and no end date provided, we might need specific logic
    // but usually the user would provide start/end times together when switching from allDay.

    const updatedTask = await task.save(); // This triggers the pre-save hook in the model

    /* Alternative using findByIdAndUpdate (might not trigger pre-save as reliably for complex logic)
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );
    */

    res.json({ success: true, data: updatedTask });
  } catch (error: any) {
    console.error("Error updating task/event:", error);
    if (error.name === "ValidationError") {
      res
        .status(400)
        .json({
          success: false,
          message: "Validation Error",
          errors: error.errors,
        });
    } else {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

// Delete a task or event
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid ID format" });
      return;
    }

    const task = await Task.findOneAndDelete({ _id: id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ success: false, message: "Entry not found" });
      return;
    }

    res.json({ success: true, message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting task/event:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Other existing functions like getTaskStats, updateTaskTime ---
// Ensure updateTaskTime still makes sense or adjust if needed.
// If updateTaskTime was specific to Pomodoro-linked tasks, it might need removal or modification.

export const getTaskStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const totalTasks = await Task.countDocuments({
      user: userId,
      type: CalendarEntryType.TASK,
    });
    const completedTasks = await Task.countDocuments({
      user: userId,
      type: CalendarEntryType.TASK,
      status: TaskStatus.COMPLETED,
    });
    const pendingTasks = totalTasks - completedTasks;

    // Aggregate tasks by priority
    const priorityCounts = await Task.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: CalendarEntryType.TASK,
        },
      },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Aggregate tasks by status
    const statusCounts = await Task.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: CalendarEntryType.TASK,
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format counts for easier frontend use
    const formatCounts = (counts: any[], possibleValues: string[]) => {
      const result: { [key: string]: number } = {};
      possibleValues.forEach((val) => (result[val] = 0)); // Initialize all possible values to 0
      counts.forEach((item) => {
        if (item._id) {
          // Ensure _id is not null/undefined
          result[item._id] = item.count;
        }
      });
      return result;
    };

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        priority: formatCounts(priorityCounts, Object.values(TaskPriority)),
        status: formatCounts(statusCounts, Object.values(TaskStatus)),
      },
    });
  } catch (error) {
    console.error("Error fetching task stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Assuming updateTaskTime is still relevant for tasks
export const updateTaskTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { timeChange } = req.body; // Expecting timeChange in minutes (positive or negative)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid Task ID" });
      return;
    }
    if (typeof timeChange !== "number") {
      res
        .status(400)
        .json({ success: false, message: "Invalid timeChange value" });
      return;
    }

    const task = await Task.findOne({
      _id: id,
      user: req.user?.id,
      type: CalendarEntryType.TASK,
    });

    if (!task) {
      res
        .status(404)
        .json({ success: false, message: "Task not found or not accessible" });
      return;
    }

    // Initialize remainingTime if it doesn't exist, based on estimatedTime or 0
    if (task.remainingTime === undefined || task.remainingTime === null) {
      task.remainingTime = task.estimatedTime || 0;
    }

    // Update remaining time, ensuring it doesn't go below zero
    task.remainingTime = Math.max(0, task.remainingTime + timeChange);

    // Optionally update status if remaining time becomes 0
    if (task.remainingTime === 0 && task.status !== TaskStatus.COMPLETED) {
      // Decide if reaching 0 time automatically completes the task
      // task.status = TaskStatus.COMPLETED;
    }

    await task.save();

    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Error updating task time:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
