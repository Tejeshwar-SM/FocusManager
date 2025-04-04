import { useState, useRef, useEffect } from "react";

export const useTimer = () => {
  const [timer, setTimer] = useState({
    minutes: 25,
    seconds: 0,
  });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState("focus");
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // For custom time settings
  const [customTime, setCustomTime] = useState(25);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

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
              // This will be handled outside this hook
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

  return {
    timer,
    setTimer,
    isActive,
    setIsActive,
    isPaused,
    setIsPaused,
    sessionType,
    setSessionType,
    cycles,
    setCycles,
    customTime,
    setCustomTime,
    showCustomTimeModal,
    setShowCustomTimeModal,
    timerCompleted,
    setTimerCompleted,
    intervalRef,
    formatTime,
    handleCustomTimeChange,
    saveCustomTime,
    handleSwitchSessionType,
  };
};
