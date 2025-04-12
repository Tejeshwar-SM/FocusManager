import React from "react";
import styles from "../../styles/pomodoro/SessionHistory.module.css";

interface PopulatedTask {
  _id: string;
  title: string;
}

enum SessionStatus {
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

enum SessionType {
  FOCUS = "focus",
  SHORT_BREAK = "short",
  LONG_BREAK = "long",
}

interface Session {
  _id: string;
  startTime: string;
  duration: number; 
  status: SessionStatus;
  type: SessionType; // 'focus', 'short', 'long'
  taskId?: PopulatedTask | null; // Task object (or null/undefined)
}

interface SessionHistoryProps {
  history: Session[];
  loading: boolean;
}

// Helper function to format Date objects
const formatDateTime = (isoString: string): { date: string; time: string } => {
  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      return { date: "Invalid Date", time: "" };
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return {
      date: dateObj.toLocaleDateString("en-US", dateOptions),
      time: dateObj.toLocaleTimeString("en-US", timeOptions),
    };
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return { date: "Error", time: "" };
  }
};

// Helper to format status string for display
const formatStatus = (status: SessionStatus): string => {
  switch (status) {
    case SessionStatus.IN_PROGRESS:
      return "In Progress";
    case SessionStatus.COMPLETED:
      return "Completed";
    case SessionStatus.CANCELLED:
      return "Cancelled";
    default:
      return status; // Fallback
  }
};

// Helper to format session type string for display
const formatType = (type: SessionType): string => {
  switch (type) {
    case SessionType.FOCUS:
      return "Focus";
    case SessionType.SHORT_BREAK:
      return "Short Break";
    case SessionType.LONG_BREAK:
      return "Long Break";
    default:
      return type; // Fallback
  }
};

// Helper to combine class names
const classNames = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

const SessionHistory: React.FC<SessionHistoryProps> = ({
  history,
  loading,
}) => {
  // Sort history by startTime descending and take the last 5
  const recentHistory = React.useMemo(() => {
    return [...history] // Shallow copy
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, 5);
  }, [history]);

  return (
    // Use styles object for class names
    <div className={styles.sessionHistory}>
      <h2>Recent Sessions</h2>
      {loading ? (
        <p className={styles.loadingMessage}>Loading history...</p>
      ) : recentHistory.length > 0 ? (
        <ul className={styles.historyList}>
          {recentHistory.map((session) => {
            const { date, time } = formatDateTime(session.startTime);
            const sessionTypeDisplay = formatType(session.type);
            const statusDisplay = formatStatus(session.status);

            // Get task title from populated taskId object
            const taskTitle = session.taskId?.title || "N/A";

            return (
              <li key={session._id} className={styles.historyItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.dateTime}>
                    {date} at {time}
                  </span>
                  {/* Show type only if needed, focus is implied by task */}
                  <span className={styles.sessionType}>
                    {sessionTypeDisplay}
                  </span>
                </div>
                {/* Only show task name for focus sessions */}
                {session.type === SessionType.FOCUS && (
                  <div className={styles.itemBody}>
                    <span className={styles.taskName}>Task: {taskTitle}</span>
                  </div>
                )}
                <div className={styles.itemFooter}>
                  <span className={styles.duration}>
                    Duration: {session.duration} min
                  </span>
                  <span
                    className={classNames(
                      styles.status,
                      styles[session.status]
                    )}
                  >
                    {statusDisplay}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.noHistoryMessage}>No recent sessions found.</p>
      )}
    </div>
  );
};

export default SessionHistory;
