// src/services/PomodoroService.ts (Corrected)
import api from "./api";

// Define the expected payload type for starting a session
interface StartSessionPayload {
  duration: number;
  type: string; // 'focus', 'short', 'long'
  taskId?: string | null; // **** CHANGED from task?: string ****
}

const PomodoroService = {
  // Start a new pomodoro session
  startSession: (sessionData: StartSessionPayload) => { // **** USING INTERFACE ****
    return api.post("/pomodoro", sessionData);
  },

  // Complete a session
  completeSession: (id: string, data: { completedCycles?: number }) => { // completedCycles is optional now
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
      queryParams.date = date;
    } else {
      // Ensure backend handles default correctly or send specific date string
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryParams.date = today.toISOString();
    }
    return api.get(`/pomodoro/stats`, { params: queryParams });
  },
};

export default PomodoroService;
