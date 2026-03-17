import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
// 2. Ab app aur baaki cheezein import karo
import app from "./app"; 
import { chatHandler } from "./sockets/chat.socket";
import prisma from "./config/prisma";
import bcrypt from "bcryptjs";
import { storyCleanupJob } from "./jobs/storyCleanup";
import { snapCleanupJob } from "./jobs/snapCleanup";

const PORT = process.env.PORT || 5001;

// HTTP Server banana
const server = http.createServer(app);

// Socket.io Initialize karna
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (origin.includes("vercel.app") || origin.includes("localhost") || origin.includes("onrender.com")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
});

// App ke andar io inject taaki controllers use kar sakein
app.set("io", io);

// Cloudinary connection test (Sirf debug ke liye)
console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

// Socket Connection Handling
io.on("connection", (socket) => {
  console.log(`Connected to socket.io ✅ ID: ${socket.id}`);
  
  // Chat handler ko io instance pass karna zaroori hai agar aapko notifications bhejni hain
  chatHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected ❌");
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Server running successfully: https://snapify-backend-o0yt.onrender.com:${PORT}`);
  
  // Create or Update 'My AI' user
  try {
    const hashedPassword = await bcrypt.hash("ai_secure_password_123", 10);
    // Use an upsert so if it exists, it gets updated with the new 3D avatar
    const aiUser = await prisma.user.upsert({
      where: { username: "my_ai" },
      update: {
        displayName: "My AI ✨",
        avatarUrl: "https://img.icons8.com/3d-fluency/94/robot.png"
      },
      create: {
        username: "my_ai",
        email: "my_ai@snapify.local",
        displayName: "My AI ✨",
        password: hashedPassword,
        avatarUrl: "https://img.icons8.com/3d-fluency/94/robot.png"
      }
    });
    console.log(`🤖 'My AI' initialized. Avatar: ${aiUser.avatarUrl}`);
  } catch (error) {
    console.error("❌ Failed to initialize 'My AI':", error);
  }

  // Background Jobs Initialization
  storyCleanupJob();
  snapCleanupJob();
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully... ⏳");
  await prisma.$disconnect();
  process.exit(0);
});

// AUTO-RECOVERY: Catch unhandled crashes
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception! 🚨", err);
  // In production, you might want to restart the process
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

export default app;
