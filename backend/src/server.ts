import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import connectDB from "./config/db";
import AuthRoutes from "./routes/AuthRoutes";
import TaskRoutes from "./routes/TaskRoutes";
import PomodoroRoutes from "./routes/PomodoroRoutes";
import CalendarRoutes from "./routes/CalendarRoutes";
import LeaderboardRoutes from "./routes/LeaderboardRoutes"; // New import
import journalRoutes from "./routes/JournalRoutes";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
// const PORT = process.env.PORT || 8081 // AWS EB default port;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // //settings for AWS EB
  // transports: ["websocket", "polling"],
  // pingTimeout: 60000,
});

// Store Socket.IO instance for access in other files
export { io };

// middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// mongodb connection
connectDB();

// default route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

app.get("/api", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Socket.IO connection handler
io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// routes
app.use("/api/auth", AuthRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/pomodoro", PomodoroRoutes);
app.use("/api/calendar", CalendarRoutes);
app.use("/api/leaderboard", LeaderboardRoutes); // New route
app.use("/api/journal", journalRoutes);
// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
