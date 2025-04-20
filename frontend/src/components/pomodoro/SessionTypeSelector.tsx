import React from "react";
// Use module CSS if available, otherwise keep direct import
// import "../../styles/pomodoro/SessionTypeSelector.css";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; // Or use PomodoroPage styles

// Define SessionType Enum locally if not imported
enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

interface SessionTypeSelectorProps {
  sessionType: SessionType; // Use enum type
  onSwitchType: (type: SessionType) => void; // Pass enum type
  isActive: boolean;
}

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  sessionType,
  onSwitchType,
  isActive,
}) => {
  return (
    // Use class from PomodoroPage.module.css or SessionTypeSelector.module.css
    <div className={styles.sessionTypeSelector}>
      <button
        className={`${styles.sessionButton} ${sessionType === SessionType.FOCUS ? styles.active : ""}`}
        onClick={() => onSwitchType(SessionType.FOCUS)}
        disabled={isActive}
      >
        Focus
      </button>
      <button
        className={`${styles.sessionButton} ${sessionType === SessionType.SHORT_BREAK ? styles.active : ""}`}
        onClick={() => onSwitchType(SessionType.SHORT_BREAK)}
        disabled={isActive}
      >
        Short Break
      </button>
      <button
        className={`${styles.sessionButton} ${sessionType === SessionType.LONG_BREAK ? styles.active : ""}`}
        onClick={() => onSwitchType(SessionType.LONG_BREAK)}
        disabled={isActive}
      >
        Long Break
      </button>
    </div>
  );
};

export default SessionTypeSelector;