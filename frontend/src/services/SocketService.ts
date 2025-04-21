import { io, Socket } from "socket.io-client";
import { LeaderboardData } from "../types/types";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Record<string, Function[]> = {};
  
  // Initialize socket connection
  connect(): void {
    if (this.socket) return; // Already connected
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Set up the leaderboard update listener
    this.socket.on("leaderboardUpdate", (data: LeaderboardData) => {
      console.log("Received leaderboard update via socket:", {
        allTime: data.allTime.length,
        weekly: data.weekly.length,
        daily: data.daily.length
      });
      
      if (this.listeners["leaderboardUpdate"]) {
        this.listeners["leaderboardUpdate"].forEach(listener => listener(data));
      }
    });
  }

  // Disconnect socket
  disconnect(): void {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.listeners = {};
  }

  // Subscribe to leaderboard updates
  onLeaderboardUpdate(callback: (data: LeaderboardData) => void): () => void {
    if (!this.listeners["leaderboardUpdate"]) {
      this.listeners["leaderboardUpdate"] = [];
    }
    
    this.listeners["leaderboardUpdate"].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners["leaderboardUpdate"] = this.listeners["leaderboardUpdate"].filter(
        cb => cb !== callback
      );
    };
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit events to server
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error("Cannot emit event: socket not connected");
    }
  }

  // Request a manual update of the leaderboard
  requestLeaderboardUpdate(): void {
    this.emit("requestLeaderboardUpdate");
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;