import api from "./api";

const PomodoroService = {
  // Start a new pomodoro session
  startSession: (sessionData: {
    duration: number;
    type: string;
    task?: string;
  }) => {
    return api.post("/pomodoro", sessionData);
  },

  // Complete a session
  completeSession: (id: string, data: { completedCycles: number }) => {
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

  // Get session statistics
  getStats: () => {
    return api.get("/pomodoro/stats");
  },
};

export default PomodoroService;
