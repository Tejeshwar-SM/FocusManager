import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import AuthRoutes from "./routes/AuthRoutes";
import TaskRoutes from "./routes/TaskRoutes";
import PomodoroRoutes from "./routes/PomodoroRoutes";
import CalendarRoutes from "./routes/CalendarRoutes";
// import { ppid } from "process";
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//mongodb connection
connectDB();

//default route
app.get("/", (req: Request, res: Response) => {
  res.send("FM API is running fine!");
  console.log("Authorization Header:", req.headers.authorization);
});

app.get("/api", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Focus Manager API is running!",
    version: "1.0.0"
  });
});


//routes
app.use("/api/auth", AuthRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/pomodoro", PomodoroRoutes);

app.use("/api/calendar", CalendarRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
