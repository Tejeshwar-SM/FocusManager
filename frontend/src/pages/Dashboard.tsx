import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskService from "../services/TaskService";
import PomodoroService from "../services/PomodoroService";
import styles from "../styles/Dashboard.module.css";
import { Task } from "../types/TaskTypes";

// Define an interface for the stats state for better type safety
interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalCompletedSessions: number; // Today's completed FOCUS sessions
  totalFocusTime: number; // Today's completed FOCUS time (in minutes)
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalCompletedSessions: 0,
    totalFocusTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // --- useEffect Hook: Fetch data when the component mounts ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("Dashboard: Starting data fetch...");
      setLoading(true);
      setError(null);

      try {
        // Get today's date in YYYY-MM-DD format explicitly to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        console.log("Dashboard: Using date for queries:", todayString);

        // Fetch all necessary data concurrently
        const [taskResponse, taskStatsResponse, pomodoroStatsResponse] =
          await Promise.all([
            TaskService.getTasks({ limit: 4 }),
            TaskService.getStats(),
            PomodoroService.getStats(todayString), // Pass explicitly formatted date
          ]);

        // Log responses for debugging
        console.log("Dashboard: Task Stats Response:", taskStatsResponse?.data);
        console.log("Dashboard: Pomodoro Stats Response:", pomodoroStatsResponse?.data);

        // Save debug info for troubleshooting
        setDebugInfo({
          date: todayString,
          pomodoroResponse: pomodoroStatsResponse?.data
        });

        // Process tasks
        const tasksData = taskResponse?.data?.data || [];
        setRecentTasks(tasksData);

        // Process task stats
        const taskStatsData = taskStatsResponse?.data?.data;
        const totalTasks = taskStatsData?.totalTasks ?? 0;
        const completedTasks = taskStatsData?.completedTasks ?? 0;

        // Process Pomodoro stats - use correct data path
        const pomodoroStatsData = pomodoroStatsResponse?.data?.data;

        // Make sure we're accessing the correct properties based on the backend response
        const totalCompletedSessions = pomodoroStatsData?.totalCompletedSessions ?? 0;
        const totalFocusTime = pomodoroStatsData?.totalFocusTime ?? 0;

        console.log("Dashboard: Extracted Pomodoro Stats:", {
          totalCompletedSessions,
          totalFocusTime,
        });

        // Update state with the fetched data
        setStats({
          totalTasks,
          completedTasks,
          totalCompletedSessions,
          totalFocusTime,
        });
      } catch (err: any) {
        console.error("Dashboard: Error fetching dashboard data:", err);
        
        // Capture more detailed error information
        const errorDetails = {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        };
        
        console.error("Error details:", errorDetails);
        
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "An unexpected error occurred while loading dashboard data.";
          
        setError(errorMessage);

        // Reset stats to avoid stale data
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          totalCompletedSessions: 0,
          totalFocusTime: 0,
        });
        setRecentTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate task completion percentage
  const calculateCompletionRate = () => {
    if (!stats.totalTasks || stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  // Format total focus time (minutes) into "Xh Ym"
  const formatFocusTime = (totalMinutes: number): string => {
    if (isNaN(totalMinutes) || totalMinutes <= 0) {
      return "0h 0m";
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  // Utility function to combine CSS class names
  const classNames = (...classes: (string | undefined | false)[]) => {
    return classes.filter(Boolean).join(" ");
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1>Welcome back, {user?.name ?? "User"}</h1>
            <p>Here's an overview of your productivity journey</p>
          </div>
          <div className={styles.dateDisplay}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Loading state */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading your dashboard...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className={styles.errorContainer}>
          <p>⚠️ Error loading dashboard: {error}</p>
        </div>
      )}

      {/* Debug info - temporarily add this for troubleshooting */}
      {/* {debugInfo && (
        <div style={{ margin: '10px', padding: '10px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: '#f5f5f5' }}>
          <details>
            <summary>Debug Information (Click to expand)</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )} */}

      {/* Success state */}
      {!loading && !error && (
        <>
          {/* Stats Grid Section */}
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              {/* Total Tasks Card */}
              <div className={classNames(styles.statCard, styles.totalTasks)}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statContent}>
                  <h3>Total Tasks</h3>
                  <p className={styles.statNumber}>{stats.totalTasks}</p>
                </div>
                <div className={styles.statFooter}>
                  <span>All your tracked activities</span>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div
                className={classNames(styles.statCard, styles.completedTasks)}
              >
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statContent}>
                  <h3>Completed Tasks</h3>
                  <p className={styles.statNumber}>{stats.completedTasks}</p>
                </div>
                <div className={styles.statFooter}>
                  <div className={styles.completionBar}>
                    <div
                      className={styles.completionProgress}
                      style={{ width: `${calculateCompletionRate()}%` }}
                      title={`${calculateCompletionRate()}%`}
                    ></div>
                  </div>
                  <span>{calculateCompletionRate()}% Completed</span>
                </div>
              </div>

              {/* Focus Sessions Card */}
              <div
                className={classNames(styles.statCard, styles.focusSessions)}
              >
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statContent}>
                  <h3>Today's Focus Sessions</h3>
                  <p className={styles.statNumber}>
                    {stats.totalCompletedSessions}
                  </p>
                </div>
                <div className={styles.statFooter}>
                  <span>Completed focus sessions today</span>
                </div>
              </div>

              {/* Focus Time Card */}
              <div className={classNames(styles.statCard, styles.focusTime)}>
                <div className={styles.statIcon}>⌛</div>
                <div className={styles.statContent}>
                  <h3>Today's Focus Time</h3>
                  <p className={styles.statNumber}>
                    {formatFocusTime(stats.totalFocusTime)}
                  </p>
                </div>
                <div className={styles.statFooter}>
                  <span>Today's time in deep focus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks Section */}
          <section className={styles.recentTasksSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Tasks</h2>
              <button
                onClick={() => navigate("/tasks")}
                className={styles.viewAllBtn}
              >
                View All Tasks
                <span className={styles.btnIcon}>→</span>
              </button>
            </div>

            {/* Task List */}
            <div className={styles.taskList}>
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className={classNames(
                      styles.taskCard,
                      styles[`${task.priority}Priority`],
                      styles[`${task.status}Status`]
                    )}
                  >
                    <div className={styles.taskHeader}>
                      <h3>{task.title}</h3>
                      <div className={styles.taskBadges}>
                        <span
                          className={classNames(
                            styles.priorityBadge,
                            styles[task.priority]
                          )}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={classNames(
                            styles.statusBadge,
                            styles[task.status]
                          )}
                        >
                          {task.status === "inProgress"
                            ? "In Progress"
                            : task.status === "todo"
                            ? "To Do"
                            : task.status.charAt(0).toUpperCase() +
                              task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.taskDescription}>
                      {task.description || "No description."}
                    </p>
                    {task.dueDate && (
                      <p className={styles.taskDueDate}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.noDataContainer}>
                  <div className={styles.noDataIcon}>📝</div>
                  <h3>No recent tasks</h3>
                  <p>Create a new task to get started!</p>
                  <button
                    onClick={() => navigate("/tasks")}
                    className={styles.createTaskBtn}
                  >
                    Go to Tasks
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions Section */}
          <div className={styles.quickActionsContainer}>
            <h2>Quick Actions</h2>
            <div className={styles.quickActions}>
              <button
                onClick={() => navigate("/tasks")}
                className={classNames(styles.actionButton, styles.newTask)}
              >
                <span className={styles.actionIcon}>➕</span>
                <span>New Task</span>
              </button>
              <button
                onClick={() => navigate("/pomodoro")}
                className={classNames(styles.actionButton, styles.startFocus)}
              >
                <span className={styles.actionIcon}>▶️</span>
                <span>Start Focus</span>
              </button>
              <button
                onClick={() => navigate("/tasks")}
                className={classNames(styles.actionButton, styles.viewCalendar)}
              >
                <span className={styles.actionIcon}>🗓️</span>
                <span>View Tasks</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;