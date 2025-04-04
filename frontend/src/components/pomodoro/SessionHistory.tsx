import React from "react";
import "../../styles/pomodoro/SessionHistory.css";

interface SessionHistoryProps {
  history: any[];
  loading: boolean;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ history, loading }) => {
  const formatStatus = (status: string) => {
    if (status.toLowerCase() === "inprogress") {
      return "In Progress";
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="session-history">
      <h2>Recent Sessions</h2>
      {loading ? (
        <div className="loading">Loading session history...</div>
      ) : (
        <div className="history-list">
          {history.length > 0 ? (
            history.slice(0, 5).map((session) => (
              <div key={session._id} className="history-item">
                <div className="history-info">
                  <div className="history-date">
                    {new Date(session.startTime).toLocaleString()}
                  </div>
                  <div className="history-task">
                    {session.task || "No task specified"}
                  </div>
                </div>
                <div className="history-details">
                  <div className="history-duration">
                    {session.duration} minutes
                  </div>
                  <div
                    className={`history-status ${session.status.toLowerCase()}`}
                  >
                    {formatStatus(session.status)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-history">No sessions recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
