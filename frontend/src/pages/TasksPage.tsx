import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TaskService from "../services/TaskService";
import { TaskPriority, TaskStatus } from "../types/TaskTypes";
// Import CSS Module
import styles from "../styles/Tasks.module.css"; // Rename Tasks.css to Tasks.module.css

// Helper function to combine class names
const classNames = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]); // Consider defining a specific Task interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all"); // Type the filter state

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const response = await TaskService.getTasks();
      setTasks(response.data.data || []); // Ensure tasks is always an array
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setError(error.response?.data?.message || "Failed to load tasks. Please try again later.");
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(""); // Clear previous errors
      await TaskService.createTask(newTask);
      setNewTask({ // Reset form
        title: "",
        description: "",
        priority: "medium" as TaskPriority,
        dueDate: "",
      });
      setIsCreating(false);
      await fetchTasks(); // Refetch tasks after creating
    } catch (error: any) {
      console.error("Error creating task:", error);
      setError(error.response?.data?.message || "Failed to create task. Please try again.");
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      setError(""); 
      await TaskService.completeTask(id);
      await fetchTasks(); // Refetch tasks after updating
    } catch (error: any) {
      console.error("Error completing task:", error);
      setError(error.response?.data?.message || "Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Confirm deletion with the user
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      try {
        setError("");
        await TaskService.deleteTask(id);
        await fetchTasks(); // Refetch tasks after deleting
      } catch (error: any) {
        console.error("Error deleting task:", error);
        setError(error.response?.data?.message || "Failed to delete task. Please try again.");
      }
    }
  };

  
  const filteredTasks = tasks.filter((task) => {
    const statusCompleted = TaskStatus.COMPLETED || 'completed'; 
    if (filter === "all") return true;
    if (filter === "active") return task.status !== statusCompleted;
    if (filter === "completed") return task.status === statusCompleted;
    return true;
  });

  // Function to render the appropriate "No Tasks" message
  const renderNoTasksMessage = () => {
    switch (filter) {
      case 'completed':
        return <p>You haven't completed any tasks yet!</p>;
      case 'active':
        return <p>No active tasks found. Ready for a new challenge?</p>;
      case 'all':
      default:
        return (
          <>
            <p>No tasks found. Let's get productive!</p>
            <button onClick={() => setIsCreating(true)} className={styles.createFirstTaskBtn}>
              Create your first task
            </button>
          </>
        );
    }
  };

  return (
    // Use styles object for class names
    <div className={styles.tasksPage}>
      <header className={styles.tasksHeader}>
        <h1>My Tasks</h1>
        <div className={styles.headerActions}>
          <Link to="/pomodoro" className={styles.pomodoroLink}>
            Go to Pomodoro Timer
          </Link>
          <button
            className={styles.toggleCreateBtn} // Changed class name
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? "Cancel" : "+ New Task"}
          </button>
        </div>
      </header>

      {/* Display error messages */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Create Task Form */}
      {isCreating && (
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
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="dueDate">Due Date (Optional)</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                />
              </div>
            </div>

            <div className={styles.formActions}>
               <button
                type="button" // Important: type="button" to prevent form submission
                onClick={() => setIsCreating(false)}
                className={classNames(styles.formButton, styles.cancelBtn)} // Added cancel button
              >
                Cancel
              </button>
              <button type="submit" className={classNames(styles.formButton, styles.submitBtn)}>
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Filters */}
      <div className={styles.taskFilters}>
        <button
          className={classNames(styles.filterButton, filter === "all" && styles.active)}
          onClick={() => setFilter("all")}
        >
          All Tasks
        </button>
        <button
          className={classNames(styles.filterButton, filter === "active" && styles.active)}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={classNames(styles.filterButton, filter === "completed" && styles.active)}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {/* Task List or Loading/No Tasks Message */}
      {loading ? (
        <div className={styles.loading}>Loading tasks...</div> // Use styles.loading
      ) : (
        <div className={styles.tasksList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                // Combine base class with dynamic status class
                className={classNames(styles.taskItem, styles[task.status])} // e.g., styles.completed
              >
                <div className={styles.taskContent}>
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}

                  <div className={styles.taskMeta}>
                    {/* Combine base class with dynamic priority class */}
                    <span className={classNames(styles.priority, styles[task.priority])}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>

                    {task.dueDate && (
                      <span className={styles.dueDate}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.taskActions}>
                  {task.status !== (TaskStatus.COMPLETED || 'completed') && (
                    <>
                      {/* Complete Button */}
                      <button
                        className={classNames(styles.actionButton, styles.completeBtn)}
                        onClick={() => handleCompleteTask(task._id)}
                        title="Mark as completed"
                      >
                        ✓ {/* Checkmark icon */}
                      </button>
                      {/* Focus Button */}
                      <Link
                        to={`/pomodoro?task=${encodeURIComponent(task.title)}&id=${task._id}`}
                        className={classNames(styles.actionButton, styles.pomodoroBtn)}
                        title="Focus on this task"
                      >
                        ▶ {/* Play icon */}
                      </Link>
                    </>
                  )}
                  {/* Delete Button */}
                  <button
                    className={classNames(styles.actionButton, styles.deleteBtn)}
                    onClick={() => handleDeleteTask(task._id)}
                    title="Delete task"
                  >
                    ✕ {/* Cross icon */}
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Use the specific message rendering function
            <div className={styles.noTasks}>
              {renderNoTasksMessage()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
