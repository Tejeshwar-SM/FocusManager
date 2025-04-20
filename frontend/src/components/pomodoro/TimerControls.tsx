import React from "react";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; // Or use PomodoroPage styles
import { Play, Pause, RotateCcw } from "react-feather"; // Using react-feather as an example, replace if needed or use text/emoji

interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  timerCompleted: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  isPaused,
  timerCompleted,
  onStart,
  onPause,
  onReset,
}) => {
  const startPauseButtonText =
    isActive && !isPaused
      ? "Pause"
      : isPaused
      ? "Resume"
      : timerCompleted
      ? "Restart"
      : "Start";
  const startPauseButtonAction = isActive && !isPaused ? onPause : onStart;
  const StartPauseIcon = isActive && !isPaused ? Pause : Play;

  return (
    // Use class from PomodoroPage.module.css or TimerControls.module.css
    <div className={styles.timerControls}>
      <button
        onClick={onReset}
        className={`${styles.controlButton} ${styles.resetButton}`}
        title="Reset Timer"
      >
        <RotateCcw size={20} /> {/* Example Icon */}
        {/* Reset */}
      </button>
      <button
        onClick={startPauseButtonAction}
        className={`${styles.controlButton} ${styles.mainActionButton} ${
          isActive && !isPaused ? styles.pauseActive : ""
        }`}
        title={startPauseButtonText}
      >
        <StartPauseIcon size={28} /> {/* Example Icon */}
        <span>{startPauseButtonText}</span>
      </button>
      {/* Placeholder for other buttons if needed */}
      <div className={styles.controlButtonPlaceholder}></div>{" "}
      {/* Add a placeholder to balance layout if needed */}
    </div>
  );
};

export default TimerControls;
