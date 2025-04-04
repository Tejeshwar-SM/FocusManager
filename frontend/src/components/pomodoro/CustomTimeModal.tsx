import React from "react";
import "../../styles/pomodoro/CustomTimeModal.css";

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
  return (
    <div className="custom-time-modal">
      <div className="modal-content">
        <h3>Set Custom Timer</h3>
        <div className="time-input-container">
          <label>
            Focus Duration (1-180 minutes):
            <input
              type="number"
              min="1"
              max="180"
              value={customTime}
              onChange={onChange}
            />
          </label>
          <div className="preset-times">
            <button onClick={() => onChange({ target: { value: "15" } } as React.ChangeEvent<HTMLInputElement>)}>15m</button>
            <button onClick={() => onChange({ target: { value: "25" } } as React.ChangeEvent<HTMLInputElement>)}>25m</button>
            <button onClick={() => onChange({ target: { value: "30" } } as React.ChangeEvent<HTMLInputElement>)}>30m</button>
            <button onClick={() => onChange({ target: { value: "45" } } as React.ChangeEvent<HTMLInputElement>)}>45m</button>
            <button onClick={() => onChange({ target: { value: "60" } } as React.ChangeEvent<HTMLInputElement>)}>60m</button>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSave}>Save</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default CustomTimeModal;
