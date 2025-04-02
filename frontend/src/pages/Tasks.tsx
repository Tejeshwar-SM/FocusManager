import React, { useState, useEffect } from "react";
import TaskService from "../services/TaskService";
import { TaskPriority, TaskStatus } from "../types/TaskTypes";
import "../styles/Tasks.css";

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await TaskService.getTasks();
      setTasks(response.data.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again later.");
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
      await TaskService.createTask(newTask);
      setNewTask({
        title: "",
        description: "",
        priority: "medium" as TaskPriority,
        dueDate: "",
      });
      setIsCreating(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task. Please try again.");
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await TaskService.completeTask(id);
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      setError("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await TaskService.deleteTask(id);
        fetchTasks();
      } catch (error) {
        console.error("Error deleting task:", error);
        setError("Failed to delete task. Please try again.");
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active") return task.status !== TaskStatus.COMPLETED;
    if (filter === "completed") return task.status === TaskStatus.COMPLETED;
    return true;
  });

  return (
    <div className="tasks-page">
      <header className="tasks-header">
        <h1>My Tasks</h1>
        <button
          className="create-task-btn"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? "Cancel" : "Create New Task"}
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {isCreating && (
        <div className="create-task-form">
          <h2>Create New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                required
                placeholder="Task title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                placeholder="Task description (optional)"
                rows={3}
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="task-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`task-item ${task.status.toLowerCase()}`}
              >
                <div className="task-content">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}

                  <div className="task-meta">
                    <span className={`priority ${task.priority}`}>
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>

                    {task.dueDate && (
                      <span className="due-date">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {task.status !== TaskStatus.COMPLETED && (
                    <button
                      className="complete-btn"
                      onClick={() => handleCompleteTask(task._id)}
                      title="Mark as completed"
                    >
                      ✓
                    </button>
                  )}

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteTask(task._id)}
                    title="Delete task"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-tasks">
              <p>No tasks found.</p>
              <button onClick={() => setIsCreating(true)}>
                Create your first task
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
