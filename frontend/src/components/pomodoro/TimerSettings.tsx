import React from "react";
import styles from "../../styles/pomodoro/PomodoroPage.module.css"; 
import { Settings, Volume2, VolumeX } from 'react-feather'; 

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
  const SoundIcon = soundEnabled ? Volume2 : VolumeX;

  return (
    // Use class from PomodoroPage.module.css or TimerSettings.module.css
    // This component might need its own container div if it's not directly inside timerControls
    <div className={styles.timerSettingsContainer}> {/* Added a container */}
        <button
            onClick={onCustomTimeClick}
            className={`${styles.controlButton} ${styles.settingsButton}`}
            title="Set Custom Focus Time"
            disabled={isActive}
        >
            <Settings size={20} /> {/* Example Icon */}
            {/* Settings */}
        </button>
        <button
            onClick={onSoundToggle}
            className={`${styles.controlButton} ${styles.soundButton}`}
            title={soundEnabled ? "Disable Sound" : "Enable Sound"}
        >
            <SoundIcon size={20} /> {/* Example Icon */}
            {/* {soundEnabled ? "Sound On" : "Sound Off"} */}
        </button>
    </div>
  );
};

export default TimerSettings;