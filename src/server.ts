// 1. SABSE PEHLE env load karo - kuch bhi import karne se pehle
require('dotenv').config();

import http from "http";
import { Server } from "socket.io";
// 2. Ab app import karo
import app from "./app"; 
import { chatHandler } from "./sockets/chat.socket";

const PORT = process.env.PORT || 5000;

// HTTP Server banana
const server = http.createServer(app);

// Socket.io Initialize karna
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// Socket Connection Handling
io.on("connection", (socket) => {
  console.log(`Connected to socket.io ✅ ID: ${socket.id}`);
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