import React from "react";
import { Task } from "../../types/TaskTypes";
import "../../styles/pomodoro/TaskInput.css";

interface TaskInputProps {
  currentTask: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (task: Task) => void;
  availableTasks: Task[];
  showDropdown: boolean;
  isDisabled: boolean;
}

const TaskInput: React.FC<TaskInputProps> = ({
  currentTask,
  onChange,
  onSelect,
  availableTasks,
  showDropdown,
  isDisabled,
}) => {
  return (
    <div className="task-input-container">
      <input
        type="text"
        placeholder="What are you working on?"
        value={currentTask}
        onChange={onChange}
        onFocus={() => {}}
        disabled={isDisabled}
        className="task-input"
      />
      {showDropdown && availableTasks.length > 0 && (
        <div className="task-dropdown">
          {availableTasks
            .filter((task) =>
              task.title.toLowerCase().includes(currentTask.toLowerCase() || "")
            )
            .map((task) => (
              <div
                key={task._id}
                className="task-option"
                onClick={() => onSelect(task)}
              >
                <span className="task-title">{task.title}</span>
                <span
                  className={`task-priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TaskInput;
