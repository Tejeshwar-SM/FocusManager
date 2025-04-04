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
import "../../styles/pomodoro/PomodoroPage.css";

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
        (task: Task) => task.status !== "completed"
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
        <SessionTypeSelector 
          sessionType={sessionType} 
          onSwitchType={handleSwitchSessionType} 
          isActive={isActive} 
        />

        <TaskInput 
          currentTask={currentTask}
          onChange={handleTaskChange}
          onSelect={handleTaskSelect}
          availableTasks={availableTasks}
          showDropdown={showTaskDropdown}
          isDisabled={isActive && !isPaused}
        />

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

      {taskHistory.length > 0 && (
        <TaskHistory taskHistory={taskHistory} />
      )}

      <SessionHistory 
        history={history} 
        loading={loading} 
      />

      {showCustomTimeModal && (
        <CustomTimeModal 
          customTime={customTime} 
          onChange={handleCustomTimeChange} 
          onSave={saveCustomTime} 
          onClose={() => setShowCustomTimeModal(false)} 
        />
      )}

      <audio
        ref={audioRef}
        src="/sounds/achievement-bell.wav"
        preload="auto"
      ></audio>
    </div>
  );
};

export default PomodoroPage;
