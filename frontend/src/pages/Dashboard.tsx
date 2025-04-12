import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskService from "../services/TaskService";
import PomodoroService from "../services/PomodoroService";
import styles from "../styles/Dashboard.module.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState<any[]>([]); // Define type for tasks
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalCompletedSessions: 0,
    totalFocusTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true); // Set loading true at the start
      try {
        const [taskResponse, taskStatsResponse, pomodoroStatsResponse] =
          await Promise.all([
            TaskService.getTasks({ limit: 4 }),
            TaskService.getStats(),
            PomodoroService.getStats(), // Fetch today's pomodoro stats
          ]);

        setRecentTasks(taskResponse.data.data);

        setStats({
          totalTasks: taskStatsResponse.data.data.totalTasks,
          completedTasks: taskStatsResponse.data.data.completedTasks,
          totalCompletedSessions:
            pomodoroStatsResponse.data.data.totalCompletedSessions,
          totalFocusTime: pomodoroStatsResponse.data.data.totalFocusTime,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally set an error state here
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateCompletionRate = () => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper to combine class names, especially useful for dynamic ones
  const classNames = (...classes: (string | undefined | false)[]) => {
    return classes.filter(Boolean).join(" ");
  };

  return (
    // Use styles object for class names
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1>Welcome back, {user?.name}</h1>
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
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading your dashboard...</p>
        </div>
      ) : (
        <>
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              {/* Stat Cards */}
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
                    ></div>
                  </div>
                  <span>{calculateCompletionRate()}% Completed</span>
                </div>
              </div>

              <div
                className={classNames(styles.statCard, styles.focusSessions)}
              >
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statContent}>
                  <h3>Focus Sessions</h3>
                  <p className={styles.statNumber}>
                    {stats.totalCompletedSessions}
                  </p>
                </div>
                <div className={styles.statFooter}>
                  <span>Pomodoro sessions completed</span>
                </div>
              </div>

              <div className={classNames(styles.statCard, styles.focusTime)}>
                <div className={styles.statIcon}>⌛</div>
                <div className={styles.statContent}>
                  <h3>Focus Time</h3>
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

            <div className={styles.taskList}>
              {recentTasks.length > 0 ? (
                recentTasks.slice(0, 3).map((task) => (
                  // Use template literals or a helper function for dynamic classes
                  <div
                    key={task._id}
                    className={classNames(
                      styles.taskCard,
                      styles[task.priority + "Priority"], // e.g., styles.highPriority
                      styles[task.status + "Status"] // e.g., styles.completedStatus
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
                            : task.status.charAt(0).toUpperCase() +
                              task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.taskDescription}>{task.description}</p>
                  </div>
                ))
              ) : (
                <div className={styles.noDataContainer}>
                  <div className={styles.noDataIcon}>📝</div>
                  <h3>No tasks yet</h3>
                  <p>Get started by creating your first task!</p>
                  <button
                    onClick={() => navigate("/tasks")} // Navigate to tasks page to create
                    className={styles.createTaskBtn}
                  >
                    Create Task
                  </button>
                </div>
              )}
            </div>
          </section>

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
                <span>Start Focus Session</span>
              </button>
              <button
                onClick={() => navigate("/calendar")} // Assuming /calendar route exists
                className={classNames(styles.actionButton, styles.viewCalendar)} // Changed class name
              >
                <span className={styles.actionIcon}>🗓️</span>
                <span>Calendar</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
