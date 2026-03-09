// 1. SABSE PEHLE env load karo - baaki kisi bhi import se pehle
require('dotenv').config(); 

import http from "http";
import { Server } from "socket.io";
// 2. Ab app aur baaki cheezein import karo
import app from "./app"; 
import { chatHandler } from "./sockets/chat.socket";

const PORT = process.env.PORT || 5001;

// HTTP Server banana
const server = http.createServer(app);

// Socket.io Initialize karna
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // Development ke liye sab allowed hai
    methods: ["GET", "POST"],
  },
});

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

server.listen(PORT, () => {
  console.log(`🚀 Server chalu ho gaya hai: http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  process.exit(0);
});