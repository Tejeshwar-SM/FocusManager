import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; // Main page styles
import PomodoroService, { DailyStat } from "../../services/PomodoroService";
import TaskService from "../../services/TaskService";
import { Task, TaskStatus } from "../../types/types"; // Assuming TaskStatus is defined here
import SessionHistory from "./SessionHistory";
import DailyStreakGraph from "./DailyStreakGraph";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import TimerSettings from "./TimerSettings";
import CustomTimeModal from "./CustomTimeModal";
import CycleCounter from "./CycleCounter"; // Import CycleCounter
import SessionTypeSelector from "./SessionTypeSelector"; // Import SessionTypeSelector
import TaskInput from "./TaskInput"; // Import TaskInput
// Removed formatTime import
// Removed useAuth import as 'user' wasn't used
// Removed lucide-react imports

// Define SessionType Enum locally if not imported from types.ts
enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

// Simple local time formatter
const formatTimeLocal = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};


// Task Completion Modal (Inline as requested)
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

  // Using styles from PomodoroPage.module.css for modal elements
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Complete Task?</h3>
        <p>Did you finish the task: "{taskTitle}"?</p>
        <div className={styles.modalActions}>
          {/* Using text instead of icons */}
          <button onClick={onConfirm} className={`${styles.modalButton} ${styles.confirmButton}`}>
             Yes, Mark as Complete
          </button>
          <button onClick={onCancel} className={`${styles.modalButton} ${styles.cancelButton}`}>
             No, Keep Working
          </button>
        </div>
      </div>
    </div>
  );
};


const PomodoroPage: React.FC = () => {
  const location = useLocation();
  // const navigate = useNavigate(); // Keep if needed for future navigation

  // --- State Definitions ---
  const [timer, setTimer] = useState({ minutes: 25, seconds: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.FOCUS);
  const [cycles, setCycles] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]); // TODO: Define Session interface
  const [loadingHistory, setLoadingHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer tracking state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Settings state
  const [customTime, setCustomTime] = useState(25);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // Task state
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null); // Ref needed for outside click detection
  const taskDropdownRef = useRef<HTMLDivElement>(null); // Ref needed for outside click detection

  // Task completion modal state
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<{ id: string; title: string } | null>(null);

  // Daily Streak Data
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // --- Callbacks & Effects ---

  const fetchSessionHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await PomodoroService.getSessions({ limit: 5 });
      if (response.data.success) setHistory(response.data.data);
    } catch (error) { console.error("Error fetching session history:", error); }
    finally { setLoadingHistory(false); }
  }, []);

  const fetchAvailableTasks = useCallback(async () => {
    try {
      const response = await TaskService.getTasks({
        status: `${TaskStatus.TODO},${TaskStatus.IN_PROGRESS}`
      });
      if (response.data.success) {
        // Sort tasks by dueDate after fetching
        const sortedTasks = [...response.data.data].sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setAvailableTasks(sortedTasks);
      }
    } catch (error) { console.error("Error fetching available tasks:", error); }
  }, []);

  const fetchDailyStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const stats = await PomodoroService.getDailyStats();
      setDailyStats(stats);
    } catch (error) { console.error("Error fetching daily stats:", error); }
    finally { setLoadingStats(false); }
  }, []);

  const updateTaskTime = useCallback(async (taskId: string, completedTime: number) => {
    if (!taskId) return;
    try {
      const taskResponse = await TaskService.getTask(taskId);
      if (!taskResponse.data.success) return;
      const task = taskResponse.data.data;
      const currentRemaining = task.remainingTime ?? task.estimatedTime ?? 0;
      const newRemainingTime = Math.max(0, currentRemaining - completedTime);
      await TaskService.updateTask(taskId, { remainingTime: newRemainingTime });
    } catch (error) { console.error("Error updating task time:", error); }
  }, []);

  const handleTaskComplete = useCallback(async () => {
    if (!completingTask) return;
    try {
      await TaskService.updateTask(completingTask.id, { status: TaskStatus.COMPLETED });
      fetchAvailableTasks();
    } catch (error) { console.error("Error completing task:", error); }
    finally {
      setShowTaskCompletionModal(false);
      setCompletingTask(null);
    }
  }, [completingTask, fetchAvailableTasks]);

  const handleDeclineTaskComplete = () => {
    setShowTaskCompletionModal(false);
    setCompletingTask(null);
  };

  const handleTimerComplete = useCallback(async () => {
    setIsActive(false);
    setTimerCompleted(true);
    if (soundEnabled) audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
    document.title = "Time's up! - FocusBuddy";

    if (currentSessionId) {
      try {
        const response = await PomodoroService.completeSession(currentSessionId, { completedCycles: cycles });
        if (response.data.success) {
          if (sessionType === SessionType.FOCUS && currentTaskId) {
            await updateTaskTime(currentTaskId, customTime);
          }
          fetchSessionHistory();
          fetchDailyStats();
        }
      } catch (error) { console.error("Error completing session:", error); }
      finally { setCurrentSessionId(null); }
    }

    if (sessionType === SessionType.FOCUS && currentTaskId && currentTask) {
      setCompletingTask({ id: currentTaskId, title: currentTask });
      setShowTaskCompletionModal(true);
    }

    if (sessionType === SessionType.FOCUS) {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      setSessionType(newCycles % 4 === 0 ? SessionType.LONG_BREAK : SessionType.SHORT_BREAK);
    } else {
      setSessionType(SessionType.FOCUS);
    }
  }, [
    currentSessionId, fetchSessionHistory, fetchDailyStats, currentTask, currentTaskId,
    soundEnabled, sessionType, customTime, updateTaskTime, cycles
  ]);

  useEffect(() => { // Effect for URL params
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskId");
    const taskTitle = params.get("taskTitle");
    if (taskId && !isActive) {
      setCurrentTaskId(taskId);
      if (taskTitle) setCurrentTask(taskTitle);
      else TaskService.getTask(taskId).then(res => res.data.success && setCurrentTask(res.data.data.title));
    }
  }, [location.search, isActive]);

  useEffect(() => { // Effect to set timer value
    if (isActive || timerCompleted) return;
    let newMinutes = 25;
    switch (sessionType) {
      case SessionType.FOCUS: newMinutes = customTime; break;
      case SessionType.SHORT_BREAK: newMinutes = 5; break;
      case SessionType.LONG_BREAK: newMinutes = 15; break;
    }
    setTimer({ minutes: newMinutes, seconds: 0 });
    document.title = `${formatTimeLocal(newMinutes, 0)} - ${sessionType} - FocusBuddy`;
  }, [sessionType, isActive, customTime, timerCompleted]);

  useEffect(() => { // Accurate timer effect
    if (!isActive || isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      return;
    }
    const sessionDurationSeconds = (sessionType === SessionType.FOCUS ? customTime : (sessionType === SessionType.SHORT_BREAK ? 5 : 15)) * 60;
    const tick = () => {
      const now = performance.now();
      const elapsedSeconds = Math.floor(((now - (startTime ?? now)) - totalPausedTime) / 1000);
      const remainingSeconds = sessionDurationSeconds - elapsedSeconds;
      if (remainingSeconds <= 0) {
        setTimer({ minutes: 0, seconds: 0 });
        handleTimerComplete();
      } else {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setTimer({ minutes, seconds });
        document.title = `${formatTimeLocal(minutes, seconds)} - ${sessionType} - FocusBuddy`;
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isActive, isPaused, startTime, totalPausedTime, sessionType, customTime, handleTimerComplete]);

  useEffect(() => { // Initial data fetch and cleanup
    fetchSessionHistory();
    fetchAvailableTasks();
    fetchDailyStats();
    audioRef.current = new Audio("/sounds/notification.mp3"); // Ensure this path is correct
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && !isPaused) {
        e.preventDefault(); e.returnValue = "Timer is active. Sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [fetchSessionHistory, fetchAvailableTasks, fetchDailyStats, isActive, isPaused]); // Added isActive/isPaused dependencies

  useEffect(() => { // Effect to close task dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (
        taskDropdownRef.current && !taskDropdownRef.current.contains(event.target as Node) &&
        taskInputRef.current && !taskInputRef.current.contains(event.target as Node)
      ) { setShowTaskDropdown(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Empty dependency array is correct here

  // --- Event Handlers ---

  const handleStartTimer = async () => {
    if (isActive && !isPaused) return;
    setTimerCompleted(false);
    if (isPaused) { // Resume
      const now = performance.now();
      setTotalPausedTime(totalPausedTime + (now - (pausedAt ?? now)));
      setPausedAt(null); setIsPaused(false); setIsActive(true); return;
    }
    // Start new
    const durationMinutes = sessionType === SessionType.FOCUS ? customTime : (sessionType === SessionType.SHORT_BREAK ? 5 : 15);
    setTimer({ minutes: durationMinutes, seconds: 0 });
    setStartTime(performance.now()); setTotalPausedTime(0);
    setIsPaused(false); setIsActive(true);
    try {
      const payload = { duration: durationMinutes, type: sessionType, taskId: sessionType === SessionType.FOCUS ? currentTaskId : null };
      const response = await PomodoroService.startSession(payload);
      if (response.data.success) setCurrentSessionId(response.data.data._id);
      else setIsActive(false);
    } catch (error) { console.error("Error starting session:", error); setIsActive(false); }
  };

  const handlePauseTimer = () => {
    if (!isActive || isPaused) return;
    setIsPaused(true); setPausedAt(performance.now());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    document.title = `Paused - ${formatTimeLocal(timer.minutes, timer.seconds)} - FocusBuddy`;
  };

  const handleResetTimer = async () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (isActive && currentSessionId) {
      try {
        await PomodoroService.cancelSession(currentSessionId);
        fetchSessionHistory(); fetchDailyStats();
      } catch (error) { console.error("Error cancelling session:", error); }
      finally { setCurrentSessionId(null); }
    }
    setIsActive(false); setIsPaused(false); setStartTime(null); setPausedAt(null);
    setTotalPausedTime(0); setTimerCompleted(false); // setCycles(0); // Optional reset
    let defaultMinutes = sessionType === SessionType.FOCUS ? customTime : (sessionType === SessionType.SHORT_BREAK ? 5 : 15);
    setTimer({ minutes: defaultMinutes, seconds: 0 });
    document.title = `${formatTimeLocal(defaultMinutes, 0)} - ${sessionType} - FocusBuddy`;
  };

  const handleSwitchSessionType = (type: string) => { // Accept string from selector
    if (isActive) return;
    const newType = type as SessionType; // Cast to enum type
    if (Object.values(SessionType).includes(newType)) {
        setSessionType(newType);
        setTimerCompleted(false);
    } else {
        console.warn("Invalid session type:", type);
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 180) setCustomTime(value);
    else if (e.target.value === "") setCustomTime(1);
  };

  const handleSaveCustomTime = () => {
    setShowCustomTimeModal(false);
    if (!isActive && sessionType === SessionType.FOCUS) {
      setTimer({ minutes: customTime, seconds: 0 });
      document.title = `${formatTimeLocal(customTime, 0)} - Focus - FocusBuddy`;
    }
  };

  const handleOpenCustomTimeModal = () => setShowCustomTimeModal(true);
  const handleCloseCustomTimeModal = () => setShowCustomTimeModal(false);
  const handleSoundToggle = () => setSoundEnabled(!soundEnabled);

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentTask(value); setCurrentTaskId(null);
    setShowTaskDropdown(value.length > 0);
  };

  const handleTaskSelect = (task: Task) => {
    setCurrentTask(task.title); setCurrentTaskId(task._id);
    setShowTaskDropdown(false);
  };

  // Filter tasks for dropdown (moved from TaskInput component)
   const filteredTasksForDropdown = availableTasks.filter(task =>
    task.title.toLowerCase().includes(currentTask.toLowerCase()) && task._id !== currentTaskId
  );

  // --- Render ---
  return (
    <div className={styles.pomodoroPage}>
      <div className={styles.pomodoroHeader}>
        <h1>Pomodoro Timer</h1>
        <p>Stay focused and manage your work sessions effectively.</p>
      </div>

      <div className={styles.timerContainer}>
        {/* Use SessionTypeSelector Component */}
        <SessionTypeSelector
            sessionType={sessionType}
            onSwitchType={handleSwitchSessionType}
            isActive={isActive}
        />

        <TimerDisplay
            minutes={timer.minutes}
            seconds={timer.seconds}
            completed={timerCompleted}
        />

        {/* Use TaskInput Component */}
        {sessionType === SessionType.FOCUS && (
            // Pass refs to TaskInput if it needs them internally, otherwise manage dropdown visibility here
             <div ref={taskDropdownRef} className={styles.taskInputWrapper}> {/* Wrapper for positioning dropdown */}
                <TaskInput
                    currentTask={currentTask}
                    onChange={handleTaskChange}
                    onSelect={handleTaskSelect}
                    availableTasks={filteredTasksForDropdown} // Pass filtered list
                    showDropdown={showTaskDropdown} // Control visibility from parent
                    isDisabled={isActive}
                    // Pass input ref if TaskInput needs it
                    // inputRef={taskInputRef}
                />
            </div>
        )}

        <TimerControls
            isActive={isActive}
            isPaused={isPaused}
            timerCompleted={timerCompleted}
            onStart={handleStartTimer}
            onPause={handlePauseTimer}
            onReset={handleResetTimer}
        />

        <TimerSettings
            onCustomTimeClick={handleOpenCustomTimeModal}
            onSoundToggle={handleSoundToggle}
            soundEnabled={soundEnabled}
            isActive={isActive}
        />

        <CycleCounter cycles={cycles} />
      </div>

      <div className={styles.streakGraphContainer}>
        <h2>Daily Focus Streak</h2>
        {loadingStats ? ( <div className={styles.loadingMessage}>Loading streak data...</div> ) : ( <DailyStreakGraph dailyData={dailyStats} /> )}
      </div>

      <SessionHistory history={history} loading={loadingHistory} />
      


      {/* Modals */}
      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        taskTitle={completingTask?.title ?? ""}
        onConfirm={handleTaskComplete}
        onCancel={handleDeclineTaskComplete}
      />
      {/* Render CustomTimeModal conditionally */}
      {showCustomTimeModal && (
          <CustomTimeModal
            customTime={customTime}
            onChange={handleCustomTimeChange}
            onSave={handleSaveCustomTime}
            onClose={handleCloseCustomTimeModal}
          />
      )}
    </div>
  );
};

export default PomodoroPage;