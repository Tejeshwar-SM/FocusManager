import React from "react";

import styles from "../../styles/pomodoro/PomodoroPage.module.css";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  completed: boolean;
}

// Define formatTime locally within this component
const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  completed,
}) => {
  return (
    // Use class from PomodoroPage.module.css or TimerDisplay.module.css
    <div className={`${styles.timerDisplay} ${completed ? styles.completed : ""}`}>
      <span>{formatTime(minutes, seconds)}</span>
    </div>
  );
};

export default TimerDisplay;