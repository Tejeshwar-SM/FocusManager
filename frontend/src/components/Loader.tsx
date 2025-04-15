import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Loader.module.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'medium', overlay = false }) => {
  const { theme } = useAuth();
  
  return (
    <div className={`${styles.loaderContainer} ${styles[size]} ${overlay ? styles.overlay : ''}`}>
      <div 
        className={`${styles.spinner} ${theme === 'dark' ? styles.spinnerDark : ''}`}
        role="status"
        aria-label="Loading"
      >
        <svg viewBox="0 0 50 50" className={styles.circularLoader}>
          <circle 
            className={styles.circularLoaderPath}
            cx="25" 
            cy="25" 
            r="20" 
            fill="none" 
            strokeWidth="5"
          ></circle>
        </svg>
      </div>
      <span className={styles.loadingText}>Loading...</span>
    </div>
  );
};

export default Loader;