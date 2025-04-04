import React from "react";
import "../../styles/pomodoro/SessionTypeSelector.css";

interface SessionTypeSelectorProps {
  sessionType: string;
  onSwitchType: (type: string) => void;
  isActive: boolean;
}

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  sessionType,
  onSwitchType,
  isActive,
}) => {
  return (
    <div className="session-type-selector">
      <button
        className={sessionType === "focus" ? "active" : ""}
        onClick={() => onSwitchType("focus")}
        disabled={isActive}
      >
        Focus
      </button>
      <button
        className={sessionType === "short" ? "active" : ""}
        onClick={() => onSwitchType("short")}
        disabled={isActive}
      >
        Short Break
      </button>
      <button
        className={sessionType === "long" ? "active" : ""}
        onClick={() => onSwitchType("long")}
        disabled={isActive}
      >
        Long Break
      </button>
    </div>
  );
};

export default SessionTypeSelector;
