import React from "react";
// Use module CSS if available, otherwise keep direct import
// import "../../styles/pomodoro/CycleCounter.css";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; // Or use PomodoroPage styles

interface CycleCounterProps {
  cycles: number;
}

const CycleCounter: React.FC<CycleCounterProps> = ({ cycles }) => {
  return (
    // Use class from PomodoroPage.module.css or CycleCounter.module.css
    <div className={styles.cycleCounter}>
      <span>Completed Cycles: {cycles}</span>
    </div>
  );
};

export default CycleCounter;