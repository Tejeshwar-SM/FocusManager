import React from "react";
import styles from "../../styles/pomodoro/PomodoroPage.module.css";

interface CustomTimeModalProps {
  customTime: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onClose: () => void;
}

const CustomTimeModal: React.FC<CustomTimeModalProps> = ({
  customTime,
  onChange,
  onSave,
  onClose,
}) => {
  // Function to handle preset button clicks
  const handlePresetClick = (value: number) => {
    // Create a synthetic event object to pass to the onChange handler
    const syntheticEvent = {
      target: { value: String(value) },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    // Use styles from PomodoroPage.module.css
    <div className={styles.modalOverlay} onClick={onClose}>
      {" "}
      {/* Close on backdrop click */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {" "}
        {/* Prevent closing when clicking inside content */}
        <h3>Set Custom Focus Time</h3>
        <div className={styles.customTimeInputGroup}>
          <label htmlFor="customTime">Set custom focus duration:</label>
          <div className={styles.customTimeInputWrapper}>
            <input
              id="customTime"
              type="number"
              min="1"
              max="180"
              value={customTime}
              onChange={onChange}
              className={styles.customTimeInput}
            />
            <span>minutes</span>
          </div>
        </div>
        {/* Optional: Preset times - ensure styles exist */}
        <div className={styles.presetTimes}>
          <button onClick={() => handlePresetClick(15)}>15m</button>
          <button onClick={() => handlePresetClick(25)}>25m</button>
          <button onClick={() => handlePresetClick(30)}>30m</button>
          <button onClick={() => handlePresetClick(45)}>45m</button>
          <button onClick={() => handlePresetClick(60)}>60m</button>
        </div>
        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={`${styles.modalButton} ${styles.cancelButton}`}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className={`${styles.modalButton} ${styles.confirmButton}`}
          >
            Save
          </button>
        </div>
      </div>
      {/* Removed separate backdrop div as overlay handles it */}
    </div>
  );
};

export default CustomTimeModal;
