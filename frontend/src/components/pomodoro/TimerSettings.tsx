import React from "react";
import "../../styles/pomodoro/TimerSettings.css";

interface TimerSettingsProps {
  onCustomTimeClick: () => void;
  onSoundToggle: () => void;
  soundEnabled: boolean;
  isActive: boolean;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  onCustomTimeClick,
  onSoundToggle,
  soundEnabled,
  isActive,
}) => {
  return (
    <div className="timer-settings">
      <button onClick={onCustomTimeClick} disabled={isActive}>
        <span role="img" aria-label="Settings">
          ⚙️
        </span>{" "}
        Custom Time
      </button>
      <button
        onClick={onSoundToggle}
        className={!soundEnabled ? "disabled" : ""}
      >
        <span role="img" aria-label="Sound">
          {soundEnabled ? "🔊" : "🔇"}
        </span>
      </button>
    </div>
  );
};

export default TimerSettings;
