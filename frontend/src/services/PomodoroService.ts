import api from "./api";

// Define the expected payload type for starting a session
interface StartSessionPayload {
  duration: number;
  type: string; // 'focus', 'short', 'long'
  taskId?: string | null; // **** CHANGED from task?: string ****
}

// Define the expected response type for daily stats
export interface DailyStat {
    date: string; // YYYY-MM-DD
    totalDuration: number; // Total focus minutes for that day
}

const PomodoroService = {
  // Start a new pomodoro session
  startSession: (sessionData: StartSessionPayload) => {
    // **** USING INTERFACE ****
    return api.post("/pomodoro", sessionData);
  },

  // Complete a session
  completeSession: (id: string, data: { completedCycles?: number }) => {
    // completedCycles is optional now
    return api.put(`/pomodoro/${id}/complete`, data);
  },

  // Cancel a session
  cancelSession: (id: string) => {
    return api.put(`/pomodoro/${id}/cancel`);
  },

  // Get user's sessions
  getSessions: (params?: { limit?: number }) => {
    return api.get("/pomodoro", { params });
  },

  updateSession(sessionId: string, data: any) {
    return api.put(`/pomodoro/${sessionId}`, data);
  },

  // Get session statistics with optional date filtering
  getStats: (date?: string) => {
    let queryParams: { date?: string } = {};

    if (date) {
      // If date is explicitly provided, use it
      queryParams.date = date;
    } else {
      // If no date is provided, use today's date in YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      queryParams.date = `${year}-${month}-${day}`;
    }

    console.log("Requesting pomodoro stats with date:", queryParams.date);
    return api.get(`/pomodoro/stats`, { params: queryParams });
  },

  // Get daily focus time statistics for the contribution graph
  getDailyStats: async (): Promise<DailyStat[]> => {
    try {
      const response = await api.get<{ success: boolean; data: DailyStat[] }>("/pomodoro/daily-stats");
      if (response.data.success) {
        return response.data.data;
      } else {
        console.error("Failed to fetch daily stats:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      return [];
    }
  },
};

export default PomodoroService;