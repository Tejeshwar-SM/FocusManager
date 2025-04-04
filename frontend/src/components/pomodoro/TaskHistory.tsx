import React from "react";
import "../../styles/pomodoro/TaskHistory.css";

interface TaskHistoryProps {
  taskHistory: Array<{ task: string; timestamp: Date; taskId?: string }>;
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ taskHistory }) => {
  return (
    <div className="task-history">
      <h3>Completed Tasks</h3>
      <ul>
        {taskHistory.map((item, index) => (
          <li key={index}>
            <span className="task-name">{item.task}</span>
            <span className="task-time">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskHistory;
