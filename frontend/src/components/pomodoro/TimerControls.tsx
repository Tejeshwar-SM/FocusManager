import React from "react";
import "../../styles/pomodoro/TimerControls.css";

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
  return (
    <div className="timer-controls">
      {!isActive || isPaused ? (
        <button className="start-btn" onClick={onStart}>
          {isPaused ? "Resume" : timerCompleted ? "Restart" : "Start"}
        </button>
      ) : (
        <button className="pause-btn" onClick={onPause}>
          Pause
        </button>
      )}
      <button className="reset-btn" onClick={onReset}>
        Reset
      </button>
    </div>
  );
};

export default TimerControls;
