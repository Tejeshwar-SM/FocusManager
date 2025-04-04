import React from "react";
import "../../styles/pomodoro/CycleCounter.css";

interface CycleCounterProps {
  cycles: number;
}

const CycleCounter: React.FC<CycleCounterProps> = ({ cycles }) => {
  return (
    <div className="cycle-counter">
      <span>Completed Cycles: {cycles}</span>
    </div>
  );
};

export default CycleCounter;
