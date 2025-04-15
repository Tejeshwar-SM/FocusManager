import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import PomodoroService from "../../services/PomodoroService";
import TaskService from "../../services/TaskService";
import { Task } from "../../types/TaskTypes";
import SessionTypeSelector from "./SessionTypeSelector";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import TaskInput from "./TaskInput";
import TimerSettings from "./TimerSettings";
import TaskHistory from "./TaskHistory";
import SessionHistory from "./SessionHistory";
import CustomTimeModal from "./CustomTimeModal";
import CycleCounter from "./CycleCounter";
import styles from "../../styles/pomodoro/PomodoroPage.module.css";

enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

// Add task completion confirmation modal component
const TaskCompletionModal = ({
  isOpen,
  taskTitle,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Task Time Complete</h3>
        <p>
          You've completed the estimated time for: <strong>{taskTitle}</strong>
        </p>
        <p>Is this task fully completed?</p>
        <div className={styles.modalButtons}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Not yet
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Yes, mark as complete
          </button>
        </div>
      </div>
    </div>
  );
};

const PomodoroPage: React.FC = () => {
  const location = useLocation();

  // --- State Definitions ---
  const [timer, setTimer] = useState({ minutes: 25, seconds: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>(
    SessionType.FOCUS
  );
  const [cycles, setCycles] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer tracking state variables
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Custom time settings
  const [customTime, setCustomTime] = useState(25);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // Task input state
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskHistory, setTaskHistory] = useState<
    Array<{ task: string; timestamp: Date; taskId?: string }>
  >([]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Task completion modal state
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Add beforeunload event handler to warn users when refreshing with active timer
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive) {
        // Standard way to show a browser confirmation dialog
        const message =
          "You have an active Pomodoro session. If you leave, your progress will be lost and the session will be marked as cancelled.";
        e.preventDefault();
        e.returnValue = message; // For older browsers
        return message; // For modern browsers
      }
    };

    // Add the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Clean up
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive]);

  // --- Callbacks ---

  // Fetch session history
  const fetchSessionHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await PomodoroService.getSessions({ limit: 10 });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch available tasks
  const fetchAvailableTasks = useCallback(async () => {
    try {
      const response = await TaskService.getTasks();
      const activeTasks = (response.data.data || []).filter(
        (task: Task) => task.status !== "completed"
      );
      setAvailableTasks(activeTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // Update task time after a session completes
  const updateTaskTime = useCallback(
    async (taskId: string, completedTime: number) => {
      if (!taskId) return;

      try {
        console.log(
          `Updating task ${taskId} with ${completedTime} minutes completed`
        );
        const response = await TaskService.updateTaskTime(
          taskId,
          completedTime
        );

        // If task is complete (remainingTime is 0), show the completion modal
        if (response.data.isComplete && currentTask) {
          setCompletingTask({
            id: taskId,
            title: currentTask,
          });
          setShowTaskCompletionModal(true);
        }

        // Refresh task list to show updated times
        fetchAvailableTasks();

        return response.data;
      } catch (error) {
        console.error("Error updating task time:", error);
      }
    },
    [currentTask, fetchAvailableTasks]
  );

  // Handle task completion confirmation
  const handleTaskComplete = async () => {
    if (!completingTask) return;

    try {
      await TaskService.completeTask(completingTask.id);
      // Refresh tasks after completion
      fetchAvailableTasks();
      // Reset states
      setShowTaskCompletionModal(false);
      setCompletingTask(null);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // Handle declining task completion
  const handleDeclineTaskComplete = () => {
    setShowTaskCompletionModal(false);
    setCompletingTask(null);
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    console.log("PomodoroPage: Timer completed.");
    if (audioRef.current && soundEnabled) {
      try {
        audioRef.current.volume = 0.7;
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (error) {
        console.error("PomodoroPage: Error playing sound:", error);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(true);
    setStartTime(null);
    setPausedAt(null);
    setTotalPausedTime(0);

    // Add to local task history component display (if a task was present)
    if (currentTask && sessionType === SessionType.FOCUS) {
      // Only add focus sessions to task history component
      setTaskHistory((prev) => [
        ...prev,
        {
          task: currentTask,
          timestamp: new Date(),
          taskId: currentTaskId || undefined,
        },
      ]);
    }

    // --- Backend Session Completion ---
    const sessionToCompleteId = currentSessionId;
    const sessionTypeWhenCompleted = sessionType;
    const completedMinutes =
      sessionTypeWhenCompleted === SessionType.FOCUS
        ? customTime
        : sessionTypeWhenCompleted === SessionType.SHORT_BREAK
        ? 5
        : 15;

    if (sessionToCompleteId) {
      console.log(
        `PomodoroPage: Attempting to complete backend session ID: ${sessionToCompleteId}`
      );
      setCurrentSessionId(null);

      try {
        await PomodoroService.completeSession(sessionToCompleteId, {
          completedCycles: 1,
        });
        console.log(
          `PomodoroPage: Successfully completed backend session ID: ${sessionToCompleteId}`
        );

        // Increment cycle count ONLY for completed FOCUS sessions AFTER successful backend update
        if (sessionTypeWhenCompleted === SessionType.FOCUS) {
          setCycles((prev) => {
            const newCycles = prev + 1;
            console.log(
              `PomodoroPage: Incrementing cycles for completed FOCUS session. New count: ${newCycles}`
            );
            return newCycles;
          });

          // If there was a task associated with this session, update its time
          if (currentTaskId) {
            await updateTaskTime(currentTaskId, completedMinutes);
          }
        }

        fetchSessionHistory();
      } catch (error) {
        console.error(
          `PomodoroPage: Error completing session ${sessionToCompleteId} on backend:`,
          error
        );
        alert(
          `Failed to save completed session ${sessionTypeWhenCompleted}. Please check connection.`
        );
      }
    } else {
      console.warn(
        "PomodoroPage: Timer completed, but no currentSessionId found to mark on backend."
      );

      // Still update task time for focus sessions, even if no backend session was set
      if (sessionTypeWhenCompleted === SessionType.FOCUS && currentTaskId) {
        await updateTaskTime(currentTaskId, completedMinutes);
      }

      // Still increment local cycles for focus sessions if no backend ID was set
      if (sessionTypeWhenCompleted === SessionType.FOCUS) {
        setCycles((prev) => prev + 1);
        console.log(
          "PomodoroPage: Incrementing cycles for FOCUS session (no backend ID)."
        );
      }
    }
  }, [
    currentSessionId,
    fetchSessionHistory,
    currentTask,
    currentTaskId,
    soundEnabled,
    sessionType,
    customTime,
    updateTaskTime,
  ]);

  // --- Effects ---

  // Read URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const taskIdFromUrl = queryParams.get("id");
    const taskTitleFromUrl = queryParams.get("task");

    if (
      taskIdFromUrl &&
      taskTitleFromUrl &&
      (taskIdFromUrl !== currentTaskId || taskTitleFromUrl !== currentTask)
    ) {
      console.log(
        `PomodoroPage: Setting task from URL - ID: ${taskIdFromUrl}, Title: ${taskTitleFromUrl}`
      );
      setCurrentTaskId(taskIdFromUrl);
      setCurrentTask(taskTitleFromUrl);
      setSessionType(SessionType.FOCUS);

      if (!isActive) {
        setTimer({ minutes: customTime, seconds: 0 });
        setTimerCompleted(false);
      }
    }
  }, [location.search, isActive, customTime, currentTaskId, currentTask]);

  // Set timer value based on session type or custom time
  useEffect(() => {
    if (!isActive) {
      let minutes;
      switch (sessionType) {
        case SessionType.FOCUS:
          minutes = customTime;
          break;
        case SessionType.SHORT_BREAK:
          minutes = 5;
          break;
        case SessionType.LONG_BREAK:
          minutes = 15;
          break;
        default:
          minutes = 25;
      }

      if (timer.minutes !== minutes || timer.seconds !== 0) {
        setTimer({ minutes, seconds: 0 });
      }
      setTimerCompleted(false);
    }
  }, [sessionType, isActive, customTime, timer.minutes, timer.seconds]);

  // Accurate timer logic using real-time calculations
  useEffect(() => {
    const updateTimer = () => {
      if (isActive && !isPaused && startTime) {
        // Calculate elapsed time accounting for pauses
        const now = Date.now();
        const elapsed = now - startTime - totalPausedTime;

        // Get total duration in milliseconds
        let totalDurationMs;
        switch (sessionType) {
          case SessionType.FOCUS:
            totalDurationMs = customTime * 60 * 1000;
            break;
          case SessionType.SHORT_BREAK:
            totalDurationMs = 5 * 60 * 1000;
            break;
          case SessionType.LONG_BREAK:
            totalDurationMs = 15 * 60 * 1000;
            break;
          default:
            totalDurationMs = customTime * 60 * 1000;
        }

        // Calculate remaining time
        const remainingMs = Math.max(0, totalDurationMs - elapsed);
        const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
        const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

        setTimer({ minutes: remainingMinutes, seconds: remainingSeconds });

        // Check if timer has completed
        if (remainingMs <= 0) {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          handleTimerComplete();
          return;
        }

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };

    if (isActive && !isPaused) {
      // Make sure we have a startTime when timer becomes active
      if (!startTime) {
        setStartTime(Date.now());
      }

      // Start the animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else if (isPaused && startTime && !pausedAt) {
      // Record when we paused
      setPausedAt(Date.now());

      // Stop the animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else if (!isPaused && pausedAt) {
      // Calculate how long we were paused and add to total paused time
      const pauseDuration = Date.now() - pausedAt;
      setTotalPausedTime((prev) => prev + pauseDuration);
      setPausedAt(null);

      // Restart the animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }

    // Cleanup animation frame on unmount or dependency change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    isActive,
    isPaused,
    startTime,
    pausedAt,
    totalPausedTime,
    sessionType,
    customTime,
    handleTimerComplete,
  ]);

  // Fetch initial data and setup cleanup
  useEffect(() => {
    fetchSessionHistory();
    fetchAvailableTasks();

    // Cleanup: Cancel session if component unmounts while timer is active
    const sessionToCancel = currentSessionId;
    const activeState = isActive;

    return () => {
      if (sessionToCancel && activeState) {
        console.log(
          `PomodoroPage: Unmounting, cancelling session ID: ${sessionToCancel}`
        );
        PomodoroService.cancelSession(sessionToCancel).catch((error) =>
          console.error("Error cancelling session on unmount:", error)
        );
      }

      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [fetchSessionHistory, fetchAvailableTasks, isActive, currentSessionId]);

  // --- Event Handlers ---

  // Start Timer
  const startTimer = async () => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }

    // Ensure timer is reset to correct duration if starting after completion or reset
    if (timerCompleted || !isActive) {
      let minutes;
      switch (sessionType) {
        case SessionType.FOCUS:
          minutes = customTime;
          break;
        case SessionType.SHORT_BREAK:
          minutes = 5;
          break;
        case SessionType.LONG_BREAK:
          minutes = 15;
          break;
        default:
          minutes = 25;
      }
      setTimer({ minutes, seconds: 0 });
      setTimerCompleted(false);
      // Reset timing variables
      setStartTime(Date.now());
      setPausedAt(null);
      setTotalPausedTime(0);
    }

    setIsActive(true);
    setIsPaused(false);

    try {
      let durationToSend;
      switch (sessionType) {
        case SessionType.FOCUS:
          durationToSend = customTime;
          break;
        case SessionType.SHORT_BREAK:
          durationToSend = 5;
          break;
        case SessionType.LONG_BREAK:
          durationToSend = 15;
          break;
        default:
          durationToSend = customTime;
      }

      const payload = {
        duration: durationToSend,
        type: sessionType,
        taskId: sessionType === SessionType.FOCUS ? currentTaskId : null,
      };

      console.log(
        "PomodoroPage: Starting backend session with payload:",
        payload
      );

      const response = await PomodoroService.startSession(payload);
      if (response?.data?.data?._id) {
        setCurrentSessionId(response.data.data._id);
        console.log(
          `PomodoroPage: Backend session started with ID: ${response.data.data._id}`
        );
      } else {
        throw new Error("Backend did not return a session ID.");
      }
    } catch (error) {
      console.error("Error starting session:", error);
      setIsActive(false);
      setStartTime(null);
      alert(
        "Failed to start session on the server. Please check your connection."
      );
    }
  };

  // Pause Timer
  const pauseTimer = () => {
    setIsPaused(true);
  };

  // Reset Timer
  const resetTimer = async () => {
    const sessionToCancel = currentSessionId;

    if (sessionToCancel) {
      console.log(
        `PomodoroPage: Resetting timer, cancelling backend session ID: ${sessionToCancel}`
      );
      try {
        await PomodoroService.cancelSession(sessionToCancel);
        fetchSessionHistory();
      } catch (error) {
        console.error("Error cancelling session on backend:", error);
      } finally {
        setCurrentSessionId(null);
      }
    } else {
      console.log("PomodoroPage: Resetting timer (no active backend session).");
    }

    // Cancel animation frame if it exists
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(false);
    setStartTime(null);
    setPausedAt(null);
    setTotalPausedTime(0);

    // Reset timer display based on current session type and custom time
    let minutes;
    switch (sessionType) {
      case SessionType.FOCUS:
        minutes = customTime;
        break;
      case SessionType.SHORT_BREAK:
        minutes = 5;
        break;
      case SessionType.LONG_BREAK:
        minutes = 15;
        break;
      default:
        minutes = 25;
    }
    setTimer({ minutes, seconds: 0 });
  };

  // Handle changes in the custom time input modal
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 180) {
      setCustomTime(value);
    }
  };

  // Save the custom time from the modal
  const saveCustomTime = () => {
    if (!isActive && sessionType === SessionType.FOCUS) {
      setTimer({ minutes: customTime, seconds: 0 });
    }
    setShowCustomTimeModal(false);
  };

  // Switch between Focus, Short Break, Long Break
  const handleSwitchSessionType = (type: string) => {
    if (!isActive) {
      setSessionType(type as SessionType);
      setTimerCompleted(false);
    } else {
      alert("Please reset the timer before switching session type.");
    }
  };

  // Handle typing in the task input field
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentTask(value);

    if (currentTaskId) {
      console.log(
        "PomodoroPage: User typing manually, clearing linked task ID."
      );
      setCurrentTaskId(null);
    }

    setShowTaskDropdown(!!value.trim());
  };

  // Handle selecting a task from the dropdown
  const handleTaskSelect = (task: Task) => {
    console.log(
      `PomodoroPage: Task selected from dropdown - ID: ${task._id}, Title: ${task.title}`
    );
    setCurrentTask(task.title);
    setCurrentTaskId(task._id);
    setShowTaskDropdown(false);
  };

  // Toggle sound notification
  const toggleSound = () => {
    const willBeEnabled = !soundEnabled;
    setSoundEnabled(willBeEnabled);

    if (willBeEnabled && audioRef.current) {
      try {
        audioRef.current.volume = 0.5;
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((e) => console.error("Test sound play error", e));
      } catch (error) {
        console.error("Error with sound test:", error);
      }
    }
  };

  // Effect to close task dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.querySelector(`.${styles.taskInputContainer}`);
      if (container && !container.contains(event.target as Node)) {
        setShowTaskDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Render ---
  return (
    <div className={styles.pomodoroPage}>
      <header className={styles.pomodoroHeader}>
        <h1>Pomodoro Timer</h1>
        <p>Stay focused and manage your work sessions effectively.</p>
      </header>

      <div className={styles.timerContainer}>
        <SessionTypeSelector
          sessionType={sessionType}
          onSwitchType={handleSwitchSessionType}
          isActive={isActive}
        />

        {sessionType === SessionType.FOCUS && (
          <TaskInput
            containerClassName={styles.taskInputContainer}
            currentTask={currentTask}
            onChange={handleTaskChange}
            onSelect={handleTaskSelect}
            availableTasks={availableTasks}
            showDropdown={showTaskDropdown}
            isDisabled={isActive && !isPaused}
          />
        )}

        <TimerDisplay
          minutes={timer.minutes}
          seconds={timer.seconds}
          completed={timerCompleted}
        />

        <TimerSettings
          onCustomTimeClick={() => setShowCustomTimeModal(true)}
          onSoundToggle={toggleSound}
          soundEnabled={soundEnabled}
          isActive={isActive}
        />

        <TimerControls
          isActive={isActive}
          isPaused={isPaused}
          timerCompleted={timerCompleted}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
        />

        <CycleCounter cycles={cycles} />
      </div>

      {/* Task History (Focus sessions completed in this browser session) */}
      {taskHistory.length > 0 && <TaskHistory taskHistory={taskHistory} />}

      {/* Session History (From backend) */}
      <SessionHistory history={history} loading={loadingHistory} />

      {/* Custom Time Modal */}
      {showCustomTimeModal && (
        <CustomTimeModal
          customTime={customTime}
          onChange={handleCustomTimeChange}
          onSave={saveCustomTime}
          onClose={() => setShowCustomTimeModal(false)}
        />
      )}

      {/* Task Completion Confirmation Modal */}
      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        taskTitle={completingTask?.title || ""}
        onConfirm={handleTaskComplete}
        onCancel={handleDeclineTaskComplete}
      />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="/sounds/achievement-bell.wav"
        preload="auto"
      ></audio>
    </div>
  );
};

export default PomodoroPage;
