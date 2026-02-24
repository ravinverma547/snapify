import express from "express";
import cors from "cors";

// Sabhi routes ko import karein
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import friendRoutes from "./modules/friend/friend.routes";
import snapRoutes from "./modules/snap/snap.routes";
import storyRoutes from "./modules/story/story.routes";
import chatRoutes from "./modules/chat/chat.routes";
import messageRoutes from "./modules/message/message.routes";
import notificationRoutes from "./modules/notification/notification.route";
import scoreRoutes from "./modules/score/score.routes";
import reportRoutes from "./modules/report/report.routes";
import blockRoutes from "./modules/block/block.routes";
import reactionRoutes from "./modules/reaction/reaction.routes";
import streakRoutes from "./modules/streak/streak.routes";

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form-data (Snaps) handle karne ke liye

// 2. Routes Implementation
const version = "/api/v1";

app.use(`${version}/auth`, authRoutes);
app.use(`${version}/users`, userRoutes);
app.use(`${version}/friends`, friendRoutes);
app.use(`${version}/snaps`, snapRoutes);
app.use(`${version}/stories`, storyRoutes);
app.use(`${version}/chats`, chatRoutes);
app.use(`${version}/messages`, messageRoutes);
app.use(`${version}/notifications`, notificationRoutes);
app.use(`${version}/score`, scoreRoutes);
app.use(`${version}/reports`, reportRoutes);
app.use(`${version}/blocks`, blockRoutes);
app.use(`${version}/reactions`, reactionRoutes);
app.use(`${version}/streaks`, streakRoutes);

// 3. Health Check
app.get("/", (_req, res) => {
  res.send("Snapify Backend is Live! 🚀");
});

// 4. Global Error Handler (Optional but helpful)
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;