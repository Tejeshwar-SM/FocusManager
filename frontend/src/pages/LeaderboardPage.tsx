import React, { useEffect, useState } from "react";
import { LeaderboardData, LeaderboardEntry } from "../types/types";
import LeaderboardService from "../services/LeaderboardService";
import socketService from "../services/SocketService";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/leaderboard/LeaderboardPage.module.css";

// Icons
const TrophyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z" />
  </svg>
);

const TimerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
  </svg>
);

const SessionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  </svg>
);

const TaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5zM11 6H5v2h6V6zm0 3H5v2h6V9zm0 3H5v2h6v-2z" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z" />
    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
  </svg>
);

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"allTime" | "weekly" | "monthly">(
    "allTime"
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    allTime: [],
    weekly: [],
    monthly: [],
  });
  const [userRanking, setUserRanking] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maxFocusTime, setMaxFocusTime] = useState<number>(1);

  // Format time (minutes) to hours and minutes
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    return `${hours}h ${mins}m`;
  };

  // Get user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Initialize data and socket connection
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const [allTimeRes, weeklyRes, monthlyRes, userRes] = await Promise.all([
          LeaderboardService.getLeaderboard("all"),
          LeaderboardService.getLeaderboard("weekly"),
          LeaderboardService.getLeaderboard("monthly"),
          LeaderboardService.getUserRanking(),
        ]);

        const allTimeData = allTimeRes.data.data;
        const weeklyData = weeklyRes.data.data;
        const monthlyData = monthlyRes.data.data;

        setLeaderboardData({
          allTime: allTimeData,
          weekly: weeklyData,
          monthly: monthlyData,
        });

        // Calculate max focus time for progress bars
        const allTimeFocusTimes = allTimeData.map(
          (entry: { totalFocusTime: any }) => entry.totalFocusTime
        );
        const weeklyFocusTimes = weeklyData.map(
          (entry: { weeklyScore: any }) => entry.weeklyScore
        );
        const monthlyFocusTimes = monthlyData.map(
          (entry: { monthlyScore: any }) => entry.monthlyScore
        );

        const maxAllTime = Math.max(...allTimeFocusTimes, 1);
        const maxWeekly = Math.max(...weeklyFocusTimes, 1);
        const maxMonthly = Math.max(...monthlyFocusTimes, 1);

        if (activeTab === "allTime") setMaxFocusTime(maxAllTime);
        else if (activeTab === "weekly") setMaxFocusTime(maxWeekly);
        else setMaxFocusTime(maxMonthly);

        setUserRanking(userRes.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();

    // Connect to socket and subscribe to updates
    socketService.connect();
    const unsubscribe = socketService.onLeaderboardUpdate((data) => {
      setLeaderboardData(data);

      // Also update user ranking if possible
      if (user && user.id) {
        const currentPeriod = activeTab === "allTime" ? "all" : activeTab;
        LeaderboardService.getUserRanking(currentPeriod)
          .then((res) => setUserRanking(res.data.data))
          .catch((err) => console.error("Failed to update user ranking:", err));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, activeTab]);

  // Update max focus time when tab changes
  useEffect(() => {
    if (leaderboardData) {
      if (activeTab === "allTime") {
        const maxTime = Math.max(
          ...leaderboardData.allTime.map((e) => e.totalFocusTime),
          1
        );
        setMaxFocusTime(maxTime);
      } else if (activeTab === "weekly") {
        const maxTime = Math.max(
          ...leaderboardData.weekly.map((e) => e.weeklyScore),
          1
        );
        setMaxFocusTime(maxTime);
      } else {
        const maxTime = Math.max(
          ...leaderboardData.monthly.map((e) => e.monthlyScore),
          1
        );
        setMaxFocusTime(maxTime);
      }
    }
  }, [activeTab, leaderboardData]);

  // Get the active leaderboard based on selected tab
  const activeLeaderboard = leaderboardData[activeTab] || [];

  // Determine if current user is in the visible leaderboard
  const isUserVisible =
    user && activeLeaderboard.some((entry) => entry.user._id === user.id);

  // Get the value to display based on active tab
  const getDisplayValue = (entry: LeaderboardEntry) => {
    if (activeTab === "allTime") return entry.totalFocusTime;
    if (activeTab === "weekly") return entry.weeklyScore;
    return entry.monthlyScore;
  };

  return (
    <div className={styles.leaderboardPage}>
      <div className={styles.leaderboardHeader}>
        <h1>
          <TrophyIcon /> Leaderboard
        </h1>
        <p>Track focus time and compete with other users</p>
      </div>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "allTime" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("allTime")}
        >
          All Time
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "weekly" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          This Week
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "monthly" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("monthly")}
        >
          This Month
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading leaderboard data...</p>
        </div>
      ) : error ? (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <>
          <div className={styles.leaderboardContainer}>
            <div className={styles.leaderboardTable}>
              <div
                className={`${styles.leaderboardRow} ${styles.leaderboardHeader}`}
              >
                <div className={styles.rankColumn}>Rank</div>
                <div className={styles.userColumn}>User</div>
                <div className={styles.statsColumn}>
                  <TimerIcon />
                  <div className={styles.statLabel}>Focus Time</div>
                </div>
                <div className={styles.statsColumn}>
                  <SessionIcon />
                  <div className={styles.statLabel}>Sessions</div>
                </div>
                <div className={styles.statsColumn}>
                  <TaskIcon />
                  <div className={styles.statLabel}>Tasks</div>
                </div>
              </div>

              {activeLeaderboard.length === 0 ? (
                <div className={styles.emptyState}>
                  <EmptyStateIcon />
                  <p>
                    No data available for this time period yet. Complete focus
                    sessions to appear on the leaderboard!
                  </p>
                </div>
              ) : (
                activeLeaderboard.map((entry) => {
                  const focusTimeValue = getDisplayValue(entry);
                  const progressPercent = (focusTimeValue / maxFocusTime) * 100;

                  return (
                    <div
                      key={entry._id}
                      className={`${styles.leaderboardRow} ${
                        user && entry.user._id === user.id
                          ? styles.currentUser
                          : ""
                      }`}
                    >
                      <div className={styles.rankColumn}>
                        {entry.rank <= 3 ? (
                          <span
                            className={`${styles.topRank} ${
                              styles[`rank${entry.rank}`]
                            }`}
                          >
                            {entry.rank}
                          </span>
                        ) : (
                          entry.rank
                        )}
                      </div>

                      <div className={styles.userColumn}>
                        <div className={styles.userAvatar}>
                          {getUserInitials(entry.user.name)}
                        </div>
                        <div className={styles.userName}>
                          {entry.user.name}
                          {user && entry.user._id === user.id && (
                            <span className={styles.youTag}>You</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.statsColumn}>
                        <div className={styles.statValue}>
                          {formatTime(focusTimeValue)}
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className={styles.statsColumn}>
                        <div className={styles.statValue}>
                          {entry.completedSessions}
                        </div>
                      </div>

                      <div className={styles.statsColumn}>
                        <div className={styles.statValue}>
                          {entry.completedTasks}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {userRanking && !isUserVisible && (
            <div className={styles.userRankingSection}>
              <h3>
                <UserIcon /> Your Ranking
              </h3>
              <div className={`${styles.leaderboardRow} ${styles.currentUser}`}>
                <div className={styles.rankColumn}>{userRanking.rank}</div>

                <div className={styles.userColumn}>
                  <div className={styles.userAvatar}>
                    {getUserInitials(userRanking.user.name)}
                  </div>
                  <div className={styles.userName}>
                    {userRanking.user.name}
                    <span className={styles.youTag}>You</span>
                  </div>
                </div>

                <div className={styles.statsColumn}>
                  <div className={styles.statValue}>
                    {formatTime(
                      activeTab === "allTime"
                        ? userRanking.totalFocusTime
                        : activeTab === "weekly"
                        ? userRanking.weeklyScore
                        : userRanking.monthlyScore
                    )}
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${
                          (getDisplayValue(userRanking) / maxFocusTime) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.statsColumn}>
                  <div className={styles.statValue}>
                    {userRanking.completedSessions}
                  </div>
                </div>

                <div className={styles.statsColumn}>
                  <div className={styles.statValue}>
                    {userRanking.completedTasks}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
