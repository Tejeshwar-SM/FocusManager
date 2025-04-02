import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskService from "../services/TaskService";
import PomodoroService from "../services/PomodoroService";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    totalFocusTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent tasks
        const taskResponse = await TaskService.getTasks({ limit: 5 });
        setRecentTasks(taskResponse.data.data);

        // Fetch task stats
        const taskStatsResponse = await TaskService.getStats();

        // Fetch pomodoro stats
        const pomodoroStatsResponse = await PomodoroService.getStats();

        // Combine stats
        setStats({
          totalTasks: taskStatsResponse.data.data.totalTasks,
          completedTasks: taskStatsResponse.data.data.completedTasks,
          totalPomodoros: pomodoroStatsResponse.data.data.totalSessions,
          totalFocusTime: pomodoroStatsResponse.data.data.totalFocusTime,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Here's an overview of your productivity</p>
      </header>

      {loading ? (
        <div className="loading">Loading your dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Tasks</h3>
              <p className="stat-number">{stats.totalTasks}</p>
              <p className="stat-label">Total Tasks</p>
            </div>

            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-number">{stats.completedTasks}</p>
              <p className="stat-label">Tasks Done</p>
            </div>

            <div className="stat-card">
              <h3>Focus Sessions</h3>
              <p className="stat-number">{stats.totalPomodoros}</p>
              <p className="stat-label">Pomodoros</p>
            </div>

            <div className="stat-card">
              <h3>Focus Time</h3>
              <p className="stat-number">
                {Math.round(stats.totalFocusTime / 60)}
              </p>
              <p className="stat-label">Hours</p>
            </div>
          </div>

          <section className="recent-tasks">
            <div className="section-header">
              <h2>Recent Tasks</h2>
              <button onClick={() => navigate("/tasks")} className="view-all">
                View All
              </button>
            </div>

            <div className="task-list">
              {recentTasks.length > 0 ? (
                recentTasks.map((task: any) => (
                  <div key={task._id} className="task-card">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      <span className={`status ${task.status}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No tasks yet. Create your first task!</p>
              )}
            </div>
          </section>

          <div className="quick-actions">
            <button
              onClick={() => navigate("/tasks/new")}
              className="action-button"
            >
              New Task
            </button>
            <button
              onClick={() => navigate("/pomodoro")}
              className="action-button primary"
            >
              Start Focus Session
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
