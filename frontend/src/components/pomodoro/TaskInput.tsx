import React from "react";
import { Task } from "../../types/types";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; // Or use PomodoroPage styles

interface TaskInputProps {
  currentTask: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (task: Task) => void;
  availableTasks: Task[]; // Expecting already filtered tasks
  showDropdown: boolean; // Controlled by parent
  isDisabled: boolean;
  // inputRef?: React.RefObject<HTMLInputElement>; // Optional ref if needed
}

const TaskInput: React.FC<TaskInputProps> = ({
  currentTask,
  onChange,
  onSelect,
  availableTasks, // Receive filtered tasks
  showDropdown,
  isDisabled,
  // inputRef, // Receive ref if passed
}) => {
  return (
    // Use class from PomodoroPage.module.css or TaskInput.module.css
    <div className={styles.taskInputContainer}> {/* Use appropriate container class */}
      <input
        // ref={inputRef} // Assign ref if passed
        type="text"
        placeholder="What are you working on?"
        value={currentTask}
        onChange={onChange}
        // onFocus can be handled in parent if needed for showing dropdown
        disabled={isDisabled}
        className={styles.taskInput} // Use appropriate input class
      />
      {/* Dropdown is now positioned relative to the wrapper in PomodoroPage */}
      {showDropdown && availableTasks.length > 0 && (
        <div className={styles.taskDropdown}> {/* Use appropriate dropdown class */}
          {availableTasks.map((task) => (
              <div
                key={task._id}
                className={styles.taskOption} // Use appropriate option class
                onClick={() => onSelect(task)}
              >
                <span className={styles.taskTitle}>{task.title}</span> {/* Use appropriate title class */}
                {/* Ensure priority styles exist (e.g., styles.low, styles.medium, styles.high) */}
                <span className={`${styles.taskPriority} ${styles[task.priority]}`}>
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