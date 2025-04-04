import { useState, useRef } from "react";

export const useSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);

    // Play a test sound when enabled
    if (!soundEnabled && audioRef.current) {
      try {
        audioRef.current.volume = 0.5; // Lower volume for test
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error("Error playing test sound:", error);
        });
      } catch (error) {
        console.error("Error with sound test:", error);
      }
    }
  };

  const playSound = async () => {
    if (audioRef.current && soundEnabled) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  };

  return {
    audioRef,
    soundEnabled,
    toggleSound,
    playSound,
  };
};
