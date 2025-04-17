import { io, Socket } from "socket.io-client";
import { LeaderboardData } from "../types/types";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private leaderboardUpdateHandlers: ((data: LeaderboardData) => void)[] = [];

  // Initialize socket connection
  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("leaderboard-update", (data: LeaderboardData) => {
      this.leaderboardUpdateHandlers.forEach((handler) => handler(data));
    });
  }

  // Disconnect the socket
  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  // Subscribe to leaderboard updates
  onLeaderboardUpdate(callback: (data: LeaderboardData) => void) {
    this.leaderboardUpdateHandlers.push(callback);
    return () => {
      this.leaderboardUpdateHandlers = this.leaderboardUpdateHandlers.filter(
        (handler) => handler !== callback
      );
    };
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
