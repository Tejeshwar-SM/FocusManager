import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TaskService from "../services/TaskService";
import { TaskPriority, TaskStatus, Task, CalendarEntryType, TaskSubmission } from "../types/types";
import styles from "../styles/Tasks.module.css";

// Helper function to combine class names
const classNames = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Define proper types for our task form
interface TaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;  // Form still uses dueDate for simplicity
  estimatedTime: string; // Keep as string for the form input
}

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTask, setNewTask] = useState<TaskForm>({
    title: "",
    description: "",
    priority: TaskPriority.MEDIUM,
    dueDate: "",
    estimatedTime: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Add state for editing tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<TaskForm>({
    title: "",
    description: "",
    priority: TaskPriority.MEDIUM,
    dueDate: "",
    estimatedTime: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await TaskService.getTasks();
      setTasks(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load tasks. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for edit form input changes
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");

      // Create a properly typed submission object with required fields
      const taskToSubmit: TaskSubmission = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        type: CalendarEntryType.TASK,
        start: newTask.dueDate ? new Date(newTask.dueDate) : new Date(), // Use dueDate as start or default to now
        allDay: true // Default to all-day tasks when created from TasksPage
      };

      // Only add estimatedTime if it's not empty
      if (newTask.estimatedTime) {
        taskToSubmit.estimatedTime = Number(newTask.estimatedTime);
      }

      await TaskService.createTask(taskToSubmit);

      // Reset form
      setNewTask({
        title: "",
        description: "",
        priority: TaskPriority.MEDIUM,
        dueDate: "",
        estimatedTime: "",
      });

      setIsCreating(false);
      await fetchTasks();
    } catch (error: any) {
      console.error("Error creating task:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create task. Please try again."
      );
    }
  };

  // Function to start editing a task
  const startEditingTask = (task: Task) => {
    // Format date for HTML date input (YYYY-MM-DD)
    let formattedDate = "";
    if (task.start) {
      const date = new Date(task.start);
      formattedDate = date.toISOString().split("T")[0];
    } else if (task.dueDate) {
      // Legacy support for dueDate field
      const date = new Date(task.dueDate);
      formattedDate = date.toISOString().split("T")[0];
    }

    setEditFormData({
      title: task.title,
      description: task.description || "",
      // Ensure priority is always defined, fallback to MEDIUM if undefined
      priority: task.priority || TaskPriority.MEDIUM,
      dueDate: formattedDate,
      estimatedTime: task.estimatedTime?.toString() || "",
    });

    setEditingTaskId(task._id);
    // Close create form if it's open
    setIsCreating(false);
  };

  // Function to cancel editing
  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditFormData({
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
      dueDate: "",
      estimatedTime: "",
    });
  };

  // Function to handle submitting task edits
  const handleSubmitTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTaskId) return;

    try {
      setError("");

      // Create update payload with required fields
      const taskToUpdate: TaskSubmission = {
        title: editFormData.title,
        description: editFormData.description,
        priority: editFormData.priority,
        type: CalendarEntryType.TASK,
        start: editFormData.dueDate ? new Date(editFormData.dueDate) : new Date(), // Use dueDate as start or default to now
        allDay: true // Default to all-day tasks when edited from TasksPage
      };

      // Only include estimatedTime if provided
      if (editFormData.estimatedTime) {
        taskToUpdate.estimatedTime = Number(editFormData.estimatedTime);
      }

      await TaskService.updateTask(editingTaskId, taskToUpdate);

      // Clear edit mode and refresh tasks
      setEditingTaskId(null);
      await fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      let errorMessage = "Failed to update task. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Add validation error details if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorDetails = Object.keys(errors)
          .map(field => `${field}: ${errors[field].message}`)
          .join('; ');
        errorMessage += ` Validation errors: ${errorDetails}`;
      }
      
      setError(errorMessage);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      setError("");
      await TaskService.completeTask(id);
      await fetchTasks();
    } catch (error: any) {
      console.error("Error completing task:", error);
      let errorMessage = "Failed to complete task. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid task data. The server rejected the request.";
      }
      setError(errorMessage);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      try {
        setError("");
        await TaskService.deleteTask(id);
        await fetchTasks();
      } catch (error: any) {
        console.error("Error deleting task:", error);
        setError(
          error.response?.data?.message ||
            "Failed to delete task. Please try again."
        );
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active") return task.status !== TaskStatus.COMPLETED;
    if (filter === "completed") return task.status === TaskStatus.COMPLETED;
    return true;
  });

  // Function to render the appropriate "No Tasks" message
  const renderNoTasksMessage = () => {
    switch (filter) {
      case "completed":
        return <p>You haven't completed any tasks yet!</p>;
      case "active":
        return <p>No active tasks found. Ready for a new challenge?</p>;
      case "all":
      default:
        return (
          <>
            <p>No tasks found. Let's get productive!</p>
            <button
              onClick={() => setIsCreating(true)}
              className={styles.createFirstTaskBtn}
            >
              Create your first task
            </button>
          </>
        );
    }
  };

  // Format remaining time for display
  const formatRemainingTime = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return "No estimate";

    if (minutes <= 0) return "Completed";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  // Function to format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  // Render the edit form for a task
  const renderEditForm = () => {
    return (
      <div className={styles.editTaskForm}>
        <h2>Edit Task</h2>
        <form onSubmit={handleSubmitTaskEdit}>
          <div className={styles.formGroup}>
            <label htmlFor="edit-title">Title</label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={editFormData.title}
              onChange={handleEditInputChange}
              required
              placeholder="Task title"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-description">Description (Optional)</label>
            <textarea
              id="edit-description"
              name="description"
              value={editFormData.description}
              onChange={handleEditInputChange}
              placeholder="Task details..."
              rows={3}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                name="priority"
                value={editFormData.priority}
                onChange={handleEditInputChange}
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="edit-dueDate">Due Date</label>
              <input
                type="date"
                id="edit-dueDate"
                name="dueDate"
                value={editFormData.dueDate}
                onChange={handleEditInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-estimatedTime">Estimated Time (minutes)</label>
            <input
              type="number"
              id="edit-estimatedTime"
              name="estimatedTime"
              value={editFormData.estimatedTime}
              onChange={handleEditInputChange}
              min="1"
              placeholder="e.g., 60 for one hour"
            />
            <small className={styles.fieldHelp}>
              Updating this will recalculate remaining time while preserving
              progress.
            </small>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={cancelEditingTask}
              className={classNames(styles.formButton, styles.cancelBtn)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={classNames(styles.formButton, styles.submitBtn)}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className={styles.tasksPage}>
      <header className={styles.tasksHeader}>
        <h1>My Tasks</h1>
        <div className={styles.headerActions}>
          <Link to="/pomodoro" className={styles.pomodoroLink}>
            Go to Pomodoro Timer
          </Link>
          {!editingTaskId && (
            <button
              className={styles.toggleCreateBtn}
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </header>

      {/* Display error messages */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Create Task Form - only show when creating and not editing */}
      {isCreating && !editingTaskId && (
        <div className={styles.createTaskForm}>
          <h2>Create New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Finish project proposal"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                placeholder="Add details..."
                rows={3}
              ></textarea>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Add estimated time field */}
            <div className={styles.formGroup}>
              <label htmlFor="estimatedTime">Estimated Time (minutes)</label>
              <input
                type="number"
                id="estimatedTime"
                name="estimatedTime"
                value={newTask.estimatedTime}
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 60 for one hour"
              />
              <small className={styles.fieldHelp}>
                How many minutes do you think this task will take?
              </small>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className={classNames(styles.formButton, styles.cancelBtn)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={classNames(styles.formButton, styles.submitBtn)}
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Filters - hide when editing */}
      {!editingTaskId && (
        <div className={styles.taskFilters}>
          <button
            className={classNames(
              styles.filterButton,
              filter === "all" && styles.active
            )}
            onClick={() => setFilter("all")}
          >
            All Tasks
          </button>
          <button
            className={classNames(
              styles.filterButton,
              filter === "active" && styles.active
            )}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={classNames(
              styles.filterButton,
              filter === "completed" && styles.active
            )}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      )}

      {/* Task List or Loading/No Tasks Message */}
      {loading ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : (
        <div className={styles.tasksList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <React.Fragment key={task._id}>
                {/* Insert edit form immediately before the task being edited */}
                {editingTaskId === task._id && renderEditForm()}

                <div
                  className={classNames(
                    styles.taskItem,
                    styles[task.status],
                    editingTaskId === task._id && styles.editing
                  )}
                >
                  <div className={styles.taskContent}>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}

                    <div className={styles.taskMeta}>
                      {/* FIX: Add null check for task.priority */}
                      {task.priority ? (
                        <span
                          className={classNames(
                            styles.priority,
                            styles[task.priority]
                          )}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}{" "}
                          Priority
                        </span>
                      ) : (
                        <span className={styles.priority}>
                          Medium Priority {/* Default display when priority is missing */}
                        </span>
                      )}

                      {/* Use start date for displaying due date */}
                      {task.start && (
                        <span className={styles.dueDate}>
                          Due: {formatDate(task.start)}
                        </span>
                      )}

                      {/* Display estimated or remaining time */}
                      {(task.estimatedTime !== undefined ||
                        task.remainingTime !== undefined) && (
                        <span className={styles.timeEstimate}>
                          {formatRemainingTime(
                            task.remainingTime !== undefined
                              ? task.remainingTime
                              : task.estimatedTime
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.taskActions}>
                    {task.status !== TaskStatus.COMPLETED && (
                      <>
                        {/* Edit Button */}
                        <button
                          className={classNames(
                            styles.actionButton,
                            styles.editBtn
                          )}
                          onClick={() => startEditingTask(task)}
                          title="Edit task"
                        >
                          ✎
                        </button>
                        {/* Complete Button */}
                        <button
                          className={classNames(
                            styles.actionButton,
                            styles.completeBtn
                          )}
                          onClick={() => handleCompleteTask(task._id)}
                          title="Mark as completed"
                        >
                          ✓
                        </button>
                        {/* Focus Button */}
                        <Link
                          to={`/pomodoro?task=${encodeURIComponent(
                            task.title
                          )}&id=${task._id}`}
                          className={classNames(
                            styles.actionButton,
                            styles.pomodoroBtn
                          )}
                          title="Focus on this task"
                        >
                          ▶
                        </Link>
                      </>
                    )}
                    {/* Delete Button */}
                    <button
                      className={classNames(
                        styles.actionButton,
                        styles.deleteBtn
                      )}
                      onClick={() => handleDeleteTask(task._id)}
                      title="Delete task"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className={styles.noTasks}>{renderNoTasksMessage()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPage;