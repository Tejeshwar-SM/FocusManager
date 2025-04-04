import { useState, useCallback, useEffect } from "react";
import PomodoroService from "../services/PomodoroService";

interface UsePomodoroSessionsProps {
  timer: { minutes: number; seconds: number };
  customTime: number;
  sessionType: string;
  isActive: boolean;
  isPaused: boolean;
  timerCompleted: boolean;
  currentTask: string;
  currentTaskId: string | null;
  setIsActive: (value: boolean) => void;
  setIsPaused: (value: boolean) => void;
  setTimerCompleted: (value: boolean) => void;
  setTimer: (value: { minutes: number; seconds: number }) => void;
  setCycles: (callback: (prev: number) => number) => void;
  setCurrentSessionId: (value: string | null) => void;
}

export const usePomodoroSessions = ({
  timer,
  customTime,
  sessionType,
  isActive,
  isPaused,
  timerCompleted,
  currentTask,
  currentTaskId,
  setIsActive,
  setIsPaused,
  setTimerCompleted,
  setTimer,
  setCycles,
  setCurrentSessionId,
}: UsePomodoroSessionsProps) => {
  const [currentSessionId, _setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the provided setCurrentSessionId function
  const updateCurrentSessionId = (value: string | null) => {
    _setCurrentSessionId(value);
    setCurrentSessionId(value);
  };

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

  // Watch for timer completion
  useEffect(() => {
    if (isActive && timer.minutes === 0 && timer.seconds === 0) {
      handleTimerComplete();
    }
  }, [timer, isActive]);

  // Handle timer completion
  const handleTimerComplete = async () => {
    // Mark timer as completed but don't auto-restart
    setIsActive(false);
    setIsPaused(false);
    setTimerCompleted(true);

    if (sessionType === "focus" && currentSessionId) {
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
        
        updateCurrentSessionId(null);

        // Update cycles count
        setCycles((prev) => prev + 1);

        // Refresh session history
        fetchSessionHistory();
      } catch (error) {
        console.error("Error completing session:", error);
      }
    }
  };

  const startTimer = async (taskName: string) => {
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
        
        updateCurrentSessionId(response.data.data._id);
        
        // If we have a task name, update the session in a separate call
        if (taskName) {
          try {
            await PomodoroService.updateSession(response.data.data._id, {
              task: taskName
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
        updateCurrentSessionId(null);
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

  // Function to format status correctly
  const formatStatus = (status: string) => {
    if (status.toLowerCase() === "inprogress") {
      return "In Progress";
    }
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return {
    currentSessionId,
    setCurrentSessionId: updateCurrentSessionId,
    history,
    loading,
    fetchSessionHistory,
    startTimer,
    pauseTimer,
    resetTimer,
    formatStatus,
    handleTimerComplete,
  };
};