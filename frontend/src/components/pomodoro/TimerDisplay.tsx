import React from "react";
import "../../styles/pomodoro/TimerDisplay.css";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  completed: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  completed,
}) => {
  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  return (
    <div className={`timer-display ${completed ? "completed" : ""}`}>
      <span>{formatTime(minutes, seconds)}</span>
    </div>
  );
};

export default TimerDisplay;
