import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskService from "../services/TaskService";
import PomodoroService from "../services/PomodoroService";
import LeaderboardService from "../services/LeaderboardService";
import styles from "../styles/Dashboard.module.css";
import { Task, TaskPriority } from "../types/types";

// Define an interface for the stats state for better type safety
interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalCompletedSessions: number; // Today's completed FOCUS sessions
  totalFocusTime: number; // Today's completed FOCUS time (in minutes)
}

// Interface for user rank data
interface UserRank {
  rank: number;
  username: string;
  totalFocusTime: number;
  position: "up" | "down" | "same" | null;
  change?: number;
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
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRank, setLoadingRank] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayString = `${year}-${month}-${day}`;

        console.log("Dashboard: Using date for queries:", todayString);

        // Fetch all necessary data concurrently
        const [taskResponse, taskStatsResponse, pomodoroStatsResponse] =
          await Promise.all([
            TaskService.getTasks({ limit: 4 }),
            TaskService.getStats(),
            PomodoroService.getStats(todayString),
          ]);

        // Process tasks
        const tasksData = taskResponse?.data?.data || [];
        setRecentTasks(tasksData);

        // Process task stats
        const taskStatsData = taskStatsResponse?.data?.data;
        const totalTasks = taskStatsData?.totalTasks ?? 0;
        const completedTasks = taskStatsData?.completedTasks ?? 0;

        // Process Pomodoro stats
        const pomodoroStatsData = pomodoroStatsResponse?.data?.data;
        const totalCompletedSessions =
          pomodoroStatsData?.totalCompletedSessions ?? 0;
        const totalFocusTime = pomodoroStatsData?.totalFocusTime ?? 0;

        // Update state with the fetched data
        setStats({
          totalTasks,
          completedTasks,
          totalCompletedSessions,
          totalFocusTime,
        });
      } catch (err: any) {
        console.error("Dashboard: Error fetching dashboard data:", err);

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

    const fetchUserRank = async () => {
      setLoadingRank(true);
      try {
        // Fetch the user's ranking data
        const response = await LeaderboardService.getUserRanking("weekly");
        if (response.data.success) {
          setUserRank(response.data.data);
        }
      } catch (err: any) {
        console.error("Error fetching user ranking:", err);
      } finally {
        setLoadingRank(false);
      }
    };

    fetchDashboardData();
    fetchUserRank();
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

  // Format task status - fix for the charAt error
  const formatTaskStatus = (status: string | undefined): string => {
    if (!status) return "Status Unknown";

    if (status === "inProgress") return "In Progress";
    if (status === "todo") return "To Do";

    // Only use charAt if status exists
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get position indicator icon for rank changes
  const getRankChangeIcon = (position: string | null) => {
    if (!position || position === "same") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.rankSame}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      );
    } else if (position === "up") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.rankUp}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.rankDown}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.welcomeSection}>
            <h1>Welcome back, {user?.name ?? "User"}</h1>
            <p>Here's an overview of your productivity journey</p>
          </div>
          <div className={styles.dateDisplay}>
            <div className={styles.dateIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
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
          <div className={styles.errorIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Success state */}
      {!loading && !error && (
        <>
          {/* Stats Grid Section */}
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              {/* Total Tasks Card */}
              <div className={classNames(styles.statCard, styles.totalTasks)}>
                <div className={styles.statIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h3>Total Tasks</h3>
                  <p className={styles.statNumber}>{stats.totalTasks}</p>
                </div>
                <div className={styles.statFooter}>
                  <span>All tracked activities</span>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div
                className={classNames(styles.statCard, styles.completedTasks)}
              >
                <div className={styles.statIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
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
                <div className={styles.statIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </div>
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
                <div className={styles.statIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
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

          {/* User Rank Section - NEW */}
          <section className={styles.rankSection}>
            <div className={styles.sectionHeader}>
              <h2>Your Weekly Ranking</h2>
            </div>

            {loadingRank ? (
              <div className={styles.rankLoadingContainer}>
                <div className={styles.smallLoader}></div>
                <p>Loading ranking data...</p>
              </div>
            ) : userRank ? (
              <div className={styles.rankCard}>
                <div className={styles.rankPosition}>
                  <span className={styles.rankNumber}>#{userRank.rank}</span>
                  <div className={styles.rankChange}>
                    {getRankChangeIcon(userRank.position)}
                    {userRank.change && userRank.change !== 0 && (
                      <span className={styles.rankChangeNumber}>
                        {Math.abs(userRank.change)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.rankDetails}>
                  <h3>{userRank.username}</h3>
                  <p className={styles.rankFocusTime}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{formatFocusTime(userRank.totalFocusTime)}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className={styles.viewLeaderboardBtn}
                >
                  View Leaderboard
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ) : (
              <div className={styles.noRankContainer}>
                <div className={styles.noRankIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <h3>No Ranking Yet</h3>
                <p>
                  Complete some focus sessions to appear on the leaderboard!
                </p>
                <button
                  onClick={() => navigate("/pomodoro")}
                  className={styles.startFocusBtn}
                >
                  Start Focusing
                </button>
              </div>
            )}
          </section>

          {/* Recent Tasks Section */}
          <section className={styles.recentTasksSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Tasks</h2>
              <button
                onClick={() => navigate("/tasks")}
                className={styles.viewAllBtn}
              >
                View All Tasks
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.btnIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
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
                      task.priority
                        ? styles[`${task.priority}Priority`]
                        : styles.mediumPriority,
                      task.status
                        ? styles[`${task.status}Status`]
                        : styles.todoStatus
                    )}
                    onClick={() => navigate(`/tasks?id=${task._id}`)}
                  >
                    <div className={styles.taskHeader}>
                      <h3>{task.title}</h3>
                      <div className={styles.taskBadges}>
                        <span
                          className={classNames(
                            styles.priorityBadge,
                            styles[task.priority || "medium"]
                          )}
                        >
                          {task.priority
                            ? task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            : "Medium"}
                        </span>

                        <span
                          className={classNames(
                            styles.statusBadge,
                            styles[task.status || "todo"]
                          )}
                        >
                          {formatTaskStatus(task.status)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.taskDescription}>
                      {task.description
                        ? task.description.length > 120
                          ? `${task.description.substring(0, 120)}...`
                          : task.description
                        : "No description provided."}
                    </p>
                    {task.start ? (
                      <div className={styles.taskDueDate}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Due: {new Date(task.start).toLocaleDateString()}
                      </div>
                    ) : task.dueDate ? (
                      <div className={styles.taskDueDate}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className={styles.noDataContainer}>
                  <div className={styles.noDataIcon}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                  </div>
                  <h3>No recent tasks</h3>
                  <p>Create a new task to get started!</p>
                  <button
                    onClick={() => navigate("/tasks")}
                    className={styles.createTaskBtn}
                  >
                    Create Task
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
                <span className={styles.actionIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
                <span>New Task</span>
              </button>
              <button
                onClick={() => navigate("/pomodoro")}
                className={classNames(styles.actionButton, styles.startFocus)}
              >
                <span className={styles.actionIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                  </svg>
                </span>
                <span>Start Focus</span>
              </button>
              <button
                onClick={() => navigate("/calendar")}
                className={classNames(styles.actionButton, styles.viewCalendar)}
              >
                <span className={styles.actionIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <span>View Calendar</span>
              </button>
              <button
                onClick={() => navigate("/journal")}
                className={classNames(styles.actionButton, styles.journalEntry)}
              >
                <span className={styles.actionIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </span>
                <span>New Journal Entry</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
