import { useState, useEffect, useRef, useCallback } from "react";
import PomodoroService from "../services/PomodoroService";
import TaskService from "../services/TaskService";
import { Task } from "../types/TaskTypes";

const usePomodoro = () => {
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
  const [timerCompleted, setTimerCompleted] = useState(false);

  // For task input
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [taskHistory, setTaskHistory] = useState<
    Array<{ task: string; timestamp: Date; taskId?: string }>
  >([]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch session history
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

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    // Play sound if enabled
    if (audioRef.current && soundEnabled) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }

    // Mark timer as completed
    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(true);

    // Handle task completion
    if (currentTask) {
      setTaskHistory((prev) => [
        ...prev,
        {
          task: currentTask,
          timestamp: new Date(),
          taskId: currentTaskId || undefined,
        },
      ]);

      if (currentTaskId) {
        try {
          await TaskService.completeTask(currentTaskId);
          fetchAvailableTasks();
        } catch (error) {
          console.error("Error completing task:", error);
        }
      }
    }

    // Handle session completion
    if (sessionType === "focus" && currentSessionId) {
      try {
        await PomodoroService.completeSession(currentSessionId, {
          completedCycles: 1,
        });
        
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
        setCycles((prev) => prev + 1);
        fetchSessionHistory();
      } catch (error) {
        console.error("Error completing session:", error);
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

  // Initial data loading
  useEffect(() => {
    fetchSessionHistory();
    fetchAvailableTasks();

    return () => {
      if (currentSessionId && isActive) {
        PomodoroService.cancelSession(currentSessionId).catch((error) =>
          console.error("Error cancelling session on unmount:", error)
        );
      }
    };
  }, [currentSessionId, isActive, fetchSessionHistory, fetchAvailableTasks]);

  return {
    timer,
    isActive,
    isPaused,
    sessionType,
    cycles,
    currentSessionId,
    history,
    loading,
    audioRef,
    customTime,
    timerCompleted,
    currentTask,
    currentTaskId,
    availableTasks,
    taskHistory,
    soundEnabled,
    setTimer,
    setIsActive,
    setIsPaused,
    setSessionType,
    setCycles,
    setCurrentSessionId,
    setCustomTime,
    setTimerCompleted,
    setCurrentTask,
    setCurrentTaskId,
    setSoundEnabled,
    fetchSessionHistory,
    fetchAvailableTasks,
    handleTimerComplete,
  };
};

export default usePomodoro;
