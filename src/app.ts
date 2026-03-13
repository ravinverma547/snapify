import express from "express";
import path from "path";
import cors from "cors";

// Sabhi routes ko import karein
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import friendRoutes from "./modules/friend/friend.routes";
import snapRoutes from "./modules/snap/snap.routes";
import storyRoutes from "./modules/story/story.routes";
import chatRoutes from "./modules/chat/chat.routes";
import groupRoutes from "./modules/group/group.routes";
import messageRoutes from "./modules/message/message.routes";
import notificationRoutes from "./modules/notification/notification.route";
import scoreRoutes from "./modules/score/score.routes";
import reportRoutes from "./modules/report/report.routes";
import blockRoutes from "./modules/block/block.routes";
import reactionRoutes from "./modules/reaction/reaction.routes";
import streakRoutes from "./modules/streak/streak.routes";

const app = express();

// 1. Middlewares
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://snapify-eight-zeta.vercel.app",
    "https://snapifyy.vercel.app",
    "https://snapify-backend-o0yt.onrender.com",
    "http://localhost:5001",
    "http://localhost:5173"
  ];

  if (origin) {
    if (allowedOrigins.includes(origin) || origin.includes("vercel.app")) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form-data (Snaps) handle karne ke liye

// Serve simple test client and static assets from `public/`
app.use(express.static(path.join(__dirname, "..", "public")));

// 2. Routes Implementation
const API_VERSION = "/api/v1";

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/users`, userRoutes);
app.use(`${API_VERSION}/friends`, friendRoutes);
app.use(`${API_VERSION}/snaps`, snapRoutes);
app.use(`${API_VERSION}/stories`, storyRoutes);
app.use(`${API_VERSION}/chats`, chatRoutes);
app.use(`${API_VERSION}/groups`, groupRoutes);
app.use(`${API_VERSION}/messages`, messageRoutes);
app.use(`${API_VERSION}/notifications`, notificationRoutes);
app.use(`${API_VERSION}/score`, scoreRoutes);
app.use(`${API_VERSION}/reports`, reportRoutes);
app.use(`${API_VERSION}/blocks`, blockRoutes);
app.use(`${API_VERSION}/reactions`, reactionRoutes);
app.use(`${API_VERSION}/streaks`, streakRoutes);

// 3. Health Check
app.get("/", (_req, res) => {
  res.send("Snapify Backend is Live! 🚀");
});

// Simple route to serve the test client (also available at /test-client.html)
app.get("/test-client", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "test-client.html"));
});

// 4. Global Error Handler (Optional but helpful)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error Handler:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;