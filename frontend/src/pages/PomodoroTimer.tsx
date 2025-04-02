import React, { useState, useEffect, useRef, useCallback } from "react";
import PomodoroService from "../services/PomodoroService";
// import { SessionStatus } from "../types/TaskTypes";
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

  // Memoize handleTimerComplete to prevent unnecessary re-renders
  const handleTimerComplete = useCallback(async () => {
    // Play sound
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }

    setIsActive(false);
    setIsPaused(false);

    if (sessionType === "focus") {
      // Complete the session in the database
      if (currentSessionId) {
        try {
          await PomodoroService.completeSession(currentSessionId, {
            completedCycles: 1,
          });
          setCurrentSessionId(null);

          // Update cycles count
          setCycles((prev) => prev + 1);

          // Refresh session history
          fetchSessionHistory();
        } catch (error) {
          console.error("Error completing session:", error);
        }
      }

      // After focus session, switch to break
      const newCycles = cycles + 1;
      if (newCycles % 4 === 0) {
        setSessionType("long");
      } else {
        setSessionType("short");
      }
    } else {
      // After break, switch to focus
      setSessionType("focus");
    }
  }, [sessionType, currentSessionId, cycles, fetchSessionHistory]);

  // Set timer based on session type
  useEffect(() => {
    if (!isActive) {
      if (sessionType === "focus") {
        setTimer({ minutes: 25, seconds: 0 });
      } else if (sessionType === "short") {
        setTimer({ minutes: 5, seconds: 0 });
      } else if (sessionType === "long") {
        setTimer({ minutes: 15, seconds: 0 });
      }
    }
  }, [sessionType, isActive]);

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

  // Fetch session history on load
  useEffect(() => {
    fetchSessionHistory();

    // Clean up any active sessions if component unmounts while timer is running
    return () => {
      if (currentSessionId && isActive) {
        PomodoroService.cancelSession(currentSessionId).catch((error: any) =>
          console.error("Error cancelling session on unmount:", error)
        );
      }
    };
  }, [currentSessionId, isActive, fetchSessionHistory]);

  const startTimer = async () => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }

    if (sessionType === "focus") {
      try {
        const response = await PomodoroService.startSession({
          duration: 25,
          type: sessionType,
        });
        setCurrentSessionId(response.data.data._id);
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
      } catch (error) {
        console.error("Error cancelling session:", error);
      } finally {
        setCurrentSessionId(null);
      }
    }

    setIsActive(false);
    setIsPaused(false);

    // Reset timer based on current session type
    if (sessionType === "focus") {
      setTimer({ minutes: 25, seconds: 0 });
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
            onClick={() => !isActive && setSessionType("focus")}
            disabled={isActive}
          >
            Focus
          </button>
          <button
            className={sessionType === "short" ? "active" : ""}
            onClick={() => !isActive && setSessionType("short")}
            disabled={isActive}
          >
            Short Break
          </button>
          <button
            className={sessionType === "long" ? "active" : ""}
            onClick={() => !isActive && setSessionType("long")}
            disabled={isActive}
          >
            Long Break
          </button>
        </div>

        <div className="timer-display">
          <span>{formatTime(timer.minutes, timer.seconds)}</span>
        </div>

        <div className="timer-controls">
          {!isActive || isPaused ? (
            <button className="start-btn" onClick={startTimer}>
              {isPaused ? "Resume" : "Start"}
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

      <div className="session-history">
        <h2>Recent Sessions</h2>

        {loading ? (
          <div className="loading">Loading session history...</div>
        ) : (
          <div className="history-list">
            {history.length > 0 ? (
              history.slice(0, 5).map((session) => (
                <div key={session._id} className="history-item">
                  <div className="history-date">
                    {new Date(session.startTime).toLocaleString()}
                  </div>
                  <div className="history-duration">
                    {session.duration} minutes
                  </div>
                  <div
                    className={`history-status ${session.status.toLowerCase()}`}
                  >
                    {session.status}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-history">No sessions recorded yet.</p>
            )}
          </div>
        )}
      </div>

      <audio ref={audioRef} src="/sounds/bell.mp3" preload="auto"></audio>
    </div>
  );
};

export default PomodoroPage;
