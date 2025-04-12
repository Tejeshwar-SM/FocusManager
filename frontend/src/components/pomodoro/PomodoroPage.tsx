import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Helper function to combine class names (for conditional styling)
const classNames = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

const PomodoroPage: React.FC = () => {
  // --- State Definitions ---
  const [timer, setTimer] = useState({ minutes: 25, seconds: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>(
    SessionType.FOCUS
  ); // Use Enum
  const [cycles, setCycles] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]); // Consider defining a Session interface here too
  const [loadingHistory, setLoadingHistory] = useState(false); // Separate loading state for history
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom time settings
  const [customTime, setCustomTime] = useState(25);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // Task input
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskHistory, setTaskHistory] = useState<
    Array<{ task: string; timestamp: Date; taskId?: string }>
  >([]); // Keep this for the TaskHistory component display

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Callbacks ---

  // Fetch session history
  const fetchSessionHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await PomodoroService.getSessions({ limit: 10 }); // Fetch latest sessions
      setHistory(response.data.data || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching sessions:", error);
      // Optionally set an error state for history
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch available tasks (active tasks)
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

  // Handle timer completion (Corrected)
  const handleTimerComplete = useCallback(async () => {
    if (audioRef.current && soundEnabled) {
      try {
        audioRef.current.volume = 0.7; // Adjust volume as needed
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(true); // Mark as completed for UI state

    // Add to local task history component display (if a task was present)
    if (currentTask) {
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
    if (currentSessionId) {
      // Only complete if a session was started
      const sessionTypeWhenCompleted = sessionType; // Capture session type at time of completion
      try {
        // Call backend to mark the session as completed
        // Send completed cycles if your backend uses it, otherwise empty object {}
        // Backend should handle setting endTime and status
        await PomodoroService.completeSession(currentSessionId, {});

        // *** REMOVED updateSession call for task name ***

        setCurrentSessionId(null); // Clear session ID for the next one

        // Increment cycle count ONLY for completed FOCUS sessions
        if (sessionTypeWhenCompleted === SessionType.FOCUS) {
          setCycles((prev) => prev + 1);

          // Optionally mark the *associated* task as completed in the backend
          // This assumes a focus session completion implies task completion
          if (currentTaskId) {
            try {
              await TaskService.completeTask(currentTaskId);
              fetchAvailableTasks(); // Refresh task dropdown
            } catch (taskError) {
              console.error("Error auto-completing linked task:", taskError);
              // Don't block session completion flow if task completion fails
            }
          }
        }

        // Refresh the session history list to show the updated status
        fetchSessionHistory();
      } catch (error) {
        console.error("Error completing session on backend:", error);
        // Consider how to handle this error - maybe retry? Notify user?
        // For now, we clear the session ID anyway to prevent conflicts
        setCurrentSessionId(null);
      }
    } else {
      // If no currentSessionId, still increment cycles for focus sessions
      // (e.g., if user manually completes without starting a backend session)
      if (sessionType === SessionType.FOCUS) {
        setCycles((prev) => prev + 1);
      }
    }

    // Clear current task association after session completion (optional, maybe keep for breaks?)
    // setCurrentTask("");
    // setCurrentTaskId(null);
  }, [
    currentSessionId,
    fetchSessionHistory,
    currentTask, // Needed for local task history component
    currentTaskId, // Needed for potential task completion
    soundEnabled,
    fetchAvailableTasks,
    sessionType, // Need sessionType to know if cycle should increment
  ]);

  // --- Effects ---

  // Set timer value based on session type or custom time
  useEffect(() => {
    if (!isActive) {
      // Only reset if timer is not running
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
      setTimerCompleted(false); // Reset completed flag when switching types
    }
  }, [sessionType, isActive, customTime]);

  // Core timer interval logic
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              // Timer reached zero, stop interval here, completion handled below
              if (intervalRef.current) clearInterval(intervalRef.current);
              return prev; // Return current state (00:00)
            } else {
              // Decrement minute
              return { minutes: prev.minutes - 1, seconds: 59 };
            }
          } else {
            // Decrement second
            return { ...prev, seconds: prev.seconds - 1 };
          }
        });
      }, 1000);
    } else {
      // Clear interval if not active or paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused]); // Rerun only when active/paused state changes

  // Effect to watch for timer reaching 00:00
  useEffect(() => {
    if (isActive && timer.minutes === 0 && timer.seconds === 0) {
      handleTimerComplete(); // Call completion logic
    }
  }, [timer, isActive, handleTimerComplete]); // Depend on timer state

  // Fetch initial data and setup cleanup
  useEffect(() => {
    fetchSessionHistory();
    fetchAvailableTasks();

    // Cleanup: Cancel session if component unmounts while timer is active
    const sessionToCancel = currentSessionId;
    const activeState = isActive;
    return () => {
      if (sessionToCancel && activeState) {
        PomodoroService.cancelSession(sessionToCancel).catch((error: any) =>
          console.error("Error cancelling session on unmount:", error)
        );
      }
    };
    // currentSessionId and isActive are included to capture their value at the time of effect setup for cleanup
  }, [fetchSessionHistory, fetchAvailableTasks, currentSessionId, isActive]);

  // Start Timer (Corrected: Sends taskId in one call)
  const startTimer = async () => {
    // If paused, just resume, don't start a new session
    if (isPaused) {
      setIsPaused(false);
      return;
    }

    // If starting after completion or reset, ensure timer value is correct
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
    }

    setIsActive(true); // Start frontend timer immediately
    setIsPaused(false);

    try {
      // Prepare payload for backend
      // Determine duration based on sessionType and customTime
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
          durationToSend = customTime; // Fallback to customTime or a default
      }

      const payload = {
        duration: durationToSend,
        type: sessionType, // Send 'focus', 'short', or 'long'
        // Only associate taskId if it's a focus session AND a task ID is selected
        taskId: sessionType === SessionType.FOCUS ? currentTaskId : null,
      };

      // Start session on backend
      const response = await PomodoroService.startSession(payload);
      setCurrentSessionId(response.data.data._id);

      // *** REMOVED separate updateSession call for task name ***
    } catch (error) {
      console.error("Error starting session:", error);
      setIsActive(false); // Stop timer if API call failed
      // Optionally show an error message to the user
    }
  };

  // Pause Timer
  const pauseTimer = () => {
    setIsPaused(true);
    // No backend call needed for pause typically
  };

  // Reset Timer (Handles cancellation)
  const resetTimer = async () => {
    // If there's an active backend session, cancel it
    if (currentSessionId) {
      try {
        await PomodoroService.cancelSession(currentSessionId);
        fetchSessionHistory(); // Refresh history to show cancelled status
      } catch (error) {
        console.error("Error cancelling session on backend:", error);
        // Proceed with frontend reset even if backend fails? Decide on behavior.
      } finally {
        setCurrentSessionId(null); // Clear ID regardless
      }
    }

    // Reset frontend state
    if (intervalRef.current) clearInterval(intervalRef.current); // Clear any running interval
    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(false);

    // Reset timer display based on current session type
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

    // Optionally reset cycles? Or keep for the day? Depends on requirements.
    // setCycles(0);
  };

  // Handle changes in the custom time input modal
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Basic validation
    if (!isNaN(value) && value >= 1 && value <= 180) {
      setCustomTime(value);
    }
  };

  // Save the custom time from the modal
  const saveCustomTime = () => {
    // Update timer display immediately *only if* timer is not currently active
    if (!isActive) {
      setTimer({ minutes: customTime, seconds: 0 });
    }
    setShowCustomTimeModal(false);
  };

  // Switch between Focus, Short Break, Long Break
  const handleSwitchSessionType = (type: string) => {
    // Prevent switching if timer is active
    if (!isActive) {
      setSessionType(type as SessionType);
      // Timer value update is handled by the useEffect watching [sessionType, isActive]
      setTimerCompleted(false); // Ensure completed state is reset
    }
  };

  // Handle typing in the task input field
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentTask(value);
    setCurrentTaskId(null); // Clear selected ID if user starts typing manually
    // Show dropdown only if input is not empty
    setShowTaskDropdown(!!value.trim());
  };

  // Handle selecting a task from the dropdown
  const handleTaskSelect = (task: Task) => {
    setCurrentTask(task.title);
    setCurrentTaskId(task._id);
    setShowTaskDropdown(false); // Hide dropdown after selection
  };

  // Toggle sound notification
  const toggleSound = () => {
    const willBeEnabled = !soundEnabled;
    setSoundEnabled(willBeEnabled);

    // Play a short test sound when enabling
    if (willBeEnabled && audioRef.current) {
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

  // Effect to close task dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Find the task input container using its CSS Module class name
      const taskInputContainer = document.querySelector(
        `.${styles.taskInputContainer}`
      );
      if (
        taskInputContainer &&
        !taskInputContainer.contains(event.target as Node)
      ) {
        setShowTaskDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        {/* Render TaskInput only for focus sessions */}
        {sessionType === SessionType.FOCUS && (
          <TaskInput
            // Add container class for click outside detection
            containerClassName={styles.taskInputContainer}
            currentTask={currentTask}
            onChange={handleTaskChange}
            onSelect={handleTaskSelect}
            availableTasks={availableTasks}
            showDropdown={showTaskDropdown}
            // Disable input when timer is active and not paused
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
          isActive={isActive} // Pass active state to disable settings if needed
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

      {/* Conditionally render TaskHistory only if it has items */}
      {taskHistory.length > 0 && <TaskHistory taskHistory={taskHistory} />}

      {/* Render the corrected SessionHistory component */}
      <SessionHistory
        history={history}
        loading={loadingHistory} // Use separate loading state
      />

      {/* Custom Time Modal */}
      {showCustomTimeModal && (
        <CustomTimeModal
          customTime={customTime}
          onChange={handleCustomTimeChange}
          onSave={saveCustomTime}
          onClose={() => setShowCustomTimeModal(false)}
        />
      )}

      {/* Audio Element for notification sound */}
      <audio
        ref={audioRef}
        src="/sounds/achievement-bell.wav" // Ensure this path is correct in your public folder
        preload="auto"
      ></audio>
    </div>
  );
};

export default PomodoroPage;
