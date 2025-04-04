import React, { useState, useEffect, useRef, useCallback } from "react";
import PomodoroService from "../services/PomodoroService";
import TaskService from "../services/TaskService";
import { SessionStatus, Task, TaskStatus } from "../types/TaskTypes";
import "../styles/PomodoroPage.css";

const PomodoroPage: React.FC = () => {
  const [timer, setTimer] = useState({
    minutes: 25,
    seconds: 0,
  });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState("focus");
  const [cycles, setCycles] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // For custom time settings
  const [customTime, setCustomTime] = useState(25);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // For task input
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskHistory, setTaskHistory] = useState<
    Array<{ task: string; timestamp: Date; taskId?: string }>
  >([]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Memoize fetchSessionHistory to prevent it from changing on every render
  const fetchSessionHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PomodoroService.getSessions();
      setHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available tasks
  const fetchAvailableTasks = useCallback(async () => {
    try {
      const response = await TaskService.getTasks();
      // Filter to only show non-completed tasks
      const activeTasks = response.data.data.filter(
        (task: Task) => task.status !== TaskStatus.COMPLETED
      );
      setAvailableTasks(activeTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // Memoize handleTimerComplete to prevent unnecessary re-renders
  const handleTimerComplete = useCallback(async () => {
    // Play sound if enabled
    if (audioRef.current && soundEnabled) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }

    // Mark timer as completed but don't auto-restart
    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(true);

    // If there's a current task, add it to the task history
    if (currentTask) {
      setTaskHistory((prev) => [
        ...prev,
        {
          task: currentTask,
          timestamp: new Date(),
          taskId: currentTaskId || undefined,
        },
      ]);

      // If a task was selected from the dropdown, mark it as completed
      if (currentTaskId) {
        try {
          await TaskService.completeTask(currentTaskId);
          // Update available tasks
          fetchAvailableTasks();
        } catch (error) {
          console.error("Error completing task:", error);
        }
      }
    }

    if (sessionType === "focus") {
      // Complete the session in the database
      if (currentSessionId) {
        try {
          // Only send completedCycles as that's all the API expects
          await PomodoroService.completeSession(currentSessionId, {
            completedCycles: 1,
          });
          
          // If we need to update the task name, we would need a separate API
          // call to update the session with the task name
          if (currentTask) {
            try {
              await PomodoroService.updateSession(currentSessionId, {
                task: currentTask
              });
            } catch (updateError) {
              console.error("Error updating session task:", updateError);
            }
          }
          
          setCurrentSessionId(null);

          // Update cycles count
          setCycles((prev) => prev + 1);

          // Refresh session history
          fetchSessionHistory();
        } catch (error) {
          console.error("Error completing session:", error);
        }
      }
    }
  }, [
    sessionType,
    currentSessionId,
    fetchSessionHistory,
    currentTask,
    currentTaskId,
    soundEnabled,
    fetchAvailableTasks,
  ]);

  // Set timer based on session type
  useEffect(() => {
    if (!isActive) {
      if (sessionType === "focus") {
        // Use custom time for focus sessions
        setTimer({ minutes: customTime, seconds: 0 });
      } else if (sessionType === "short") {
        setTimer({ minutes: 5, seconds: 0 });
      } else if (sessionType === "long") {
        setTimer({ minutes: 15, seconds: 0 });
      }
    }
  }, [sessionType, isActive, customTime]);

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              // This will be handled in the next useEffect that watches for timer completion
              return prev;
            } else {
              return {
                minutes: prev.minutes - 1,
                seconds: 59,
              };
            }
          } else {
            return {
              ...prev,
              seconds: prev.seconds - 1,
            };
          }
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused]);

  // Watch for timer completion
  useEffect(() => {
    if (isActive && timer.minutes === 0 && timer.seconds === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      handleTimerComplete();
    }
  }, [timer, isActive, handleTimerComplete]);

  // Fetch session history and available tasks on load
  useEffect(() => {
    fetchSessionHistory();
    fetchAvailableTasks();

    // Clean up any active sessions if component unmounts while timer is running
    return () => {
      if (currentSessionId && isActive) {
        PomodoroService.cancelSession(currentSessionId).catch((error: any) =>
          console.error("Error cancelling session on unmount:", error)
        );
      }
    };
  }, [currentSessionId, isActive, fetchSessionHistory, fetchAvailableTasks]);

  const startTimer = async () => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }

    // If timer was completed, reset it first
    if (timerCompleted) {
      if (sessionType === "focus") {
        setTimer({ minutes: customTime, seconds: 0 });
      } else if (sessionType === "short") {
        setTimer({ minutes: 5, seconds: 0 });
      } else {
        setTimer({ minutes: 15, seconds: 0 });
      }
      setTimerCompleted(false);
    }

    if (sessionType === "focus") {
      try {
        // Create session with only the required parameters
        const response = await PomodoroService.startSession({
          duration: customTime, 
          type: sessionType,
        });
        
        setCurrentSessionId(response.data.data._id);
        
        // If we have a task name, update the session in a separate call
        if (currentTask) {
          try {
            await PomodoroService.updateSession(response.data.data._id, {
              task: currentTask
            });
          } catch (updateError) {
            console.error("Error updating session with task:", updateError);
          }
        }
      } catch (error) {
        console.error("Error starting session:", error);
        return; // Don't start the timer if API call fails
      }
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resetTimer = async () => {
    if (currentSessionId) {
      try {
        await PomodoroService.cancelSession(currentSessionId);
        // Refresh session history to show cancelled status
        fetchSessionHistory();
      } catch (error) {
        console.error("Error cancelling session:", error);
      } finally {
        setCurrentSessionId(null);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(false);

    // Reset timer based on current session type
    if (sessionType === "focus") {
      setTimer({ minutes: customTime, seconds: 0 });
    } else if (sessionType === "short") {
      setTimer({ minutes: 5, seconds: 0 });
    } else if (sessionType === "long") {
      setTimer({ minutes: 15, seconds: 0 });
    }
  };

  // Format time for display (e.g., 5:03)
  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  // Update custom time
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 180) {
      setCustomTime(value);
    }
  };

  const saveCustomTime = () => {
    // If timer is not active, update the current timer
    if (!isActive) {
      setTimer({ minutes: customTime, seconds: 0 });
    }
    setShowCustomTimeModal(false);
  };

  const handleSwitchSessionType = (type: string) => {
    if (!isActive) {
      setSessionType(type);
      setTimerCompleted(false);
    }
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTask(e.target.value);
    setCurrentTaskId(null); // Reset task ID when typing manually
    if (e.target.value.trim() === "") {
      setShowTaskDropdown(false);
    } else {
      setShowTaskDropdown(true);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setCurrentTask(task.title);
    setCurrentTaskId(task._id);
    setShowTaskDropdown(false);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);

    // Play a test sound when enabled
    if (!soundEnabled && audioRef.current) {
      try {
        audioRef.current.volume = 0.5; // Lower volume for test
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error("Error playing test sound:", error);
        });
      } catch (error) {
        console.error("Error with sound test:", error);
      }
    }
  };

  // Function to format status correctly
  const formatStatus = (status: string) => {
    if (status.toLowerCase() === "inprogress") {
      return "In Progress";
    }
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.task-input-container')) {
        setShowTaskDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="pomodoro-page">
      <header className="pomodoro-header">
        <h1>Pomodoro Timer</h1>
        <p>Focus on your tasks with timed work sessions</p>
      </header>

      <div className="timer-container">
        <div className="session-type-selector">
          <button
            className={sessionType === "focus" ? "active" : ""}
            onClick={() => handleSwitchSessionType("focus")}
            disabled={isActive}
          >
            Focus
          </button>
          <button
            className={sessionType === "short" ? "active" : ""}
            onClick={() => handleSwitchSessionType("short")}
            disabled={isActive}
          >
            Short Break
          </button>
          <button
            className={sessionType === "long" ? "active" : ""}
            onClick={() => handleSwitchSessionType("long")}
            disabled={isActive}
          >
            Long Break
          </button>
        </div>

        {/* Current task input with dropdown */}
        <div className="task-input-container">
          <input
            type="text"
            placeholder="What are you working on?"
            value={currentTask}
            onChange={handleTaskChange}
            onFocus={() => setShowTaskDropdown(true)}
            disabled={isActive && !isPaused}
            className="task-input"
          />
          {showTaskDropdown && availableTasks.length > 0 && (
            <div className="task-dropdown">
              {availableTasks
                .filter((task) =>
                  task.title
                    .toLowerCase()
                    .includes(currentTask.toLowerCase() || "")
                )
                .map((task) => (
                  <div
                    key={task._id}
                    className="task-option"
                    onClick={() => handleTaskSelect(task)}
                  >
                    <span className="task-title">{task.title}</span>
                    <span
                      className={`task-priority priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className={`timer-display ${timerCompleted ? "completed" : ""}`}>
          <span>{formatTime(timer.minutes, timer.seconds)}</span>
        </div>

        <div className="timer-settings">
          <button
            onClick={() => setShowCustomTimeModal(true)}
            disabled={isActive}
          >
            <span role="img" aria-label="Settings">
              ⚙️
            </span>{" "}
            Custom Time
          </button>
          <button
            onClick={toggleSound}
            className={!soundEnabled ? "disabled" : ""}
          >
            <span role="img" aria-label="Sound">
              {soundEnabled ? "🔊" : "🔇"}
            </span>
          </button>
        </div>

        <div className="timer-controls">
          {!isActive || isPaused ? (
            <button className="start-btn" onClick={startTimer}>
              {isPaused ? "Resume" : timerCompleted ? "Restart" : "Start"}
            </button>
          ) : (
            <button className="pause-btn" onClick={pauseTimer}>
              Pause
            </button>
          )}
          <button className="reset-btn" onClick={resetTimer}>
            Reset
          </button>
        </div>

        <div className="cycle-counter">
          <span>Completed Cycles: {cycles}</span>
        </div>
      </div>

      {/* Task history display */}
      {taskHistory.length > 0 && (
        <div className="task-history">
          <h3>Completed Tasks</h3>
          <ul>
            {taskHistory.map((item, index) => (
              <li key={index}>
                <span className="task-name">{item.task}</span>
                <span className="task-time">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="session-history">
        <h2>Recent Sessions</h2>

        {loading ? (
          <div className="loading">Loading session history...</div>
        ) : (
          <div className="history-list">
            {history.length > 0 ? (
              history.slice(0, 5).map((session) => (
                <div key={session._id} className="history-item">
                  <div className="history-info">
                    <div className="history-date">
                      {new Date(session.startTime).toLocaleString()}
                    </div>
                    <div className="history-task">
                      {session.task || "No task specified"}
                    </div>
                  </div>
                  <div className="history-details">
                    <div className="history-duration">
                      {session.duration} minutes
                    </div>
                    <div
                      className={`history-status ${session.status.toLowerCase()}`}
                    >
                      {formatStatus(session.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-history">No sessions recorded yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Custom time modal */}
      {showCustomTimeModal && (
        <div className="custom-time-modal">
          <div className="modal-content">
            <h3>Set Custom Timer</h3>
            <div className="time-input-container">
              <label>
                Focus Duration (1-180 minutes):
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customTime}
                  onChange={handleCustomTimeChange}
                />
              </label>
              <div className="preset-times">
                <button onClick={() => setCustomTime(15)}>15m</button>
                <button onClick={() => setCustomTime(25)}>25m</button>
                <button onClick={() => setCustomTime(30)}>30m</button>
                <button onClick={() => setCustomTime(45)}>45m</button>
                <button onClick={() => setCustomTime(60)}>60m</button>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCustomTimeModal(false)}>
                Cancel
              </button>
              <button onClick={saveCustomTime}>Save</button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowCustomTimeModal(false)}
          />
        </div>
      )}

      {/* Audio element for bell sound */}
      <audio
        ref={audioRef}
        src="/sounds/achievement-bell.wav"
        preload="auto"
      ></audio>
    </div>
  );
};

export default PomodoroPage;