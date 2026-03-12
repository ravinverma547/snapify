import { Server } from "socket.io";
import http from "http";

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Production mein isko specific domain par set karna
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    // Join personal room for private snaps/messages
    socket.on("join_room", (userId: string) => {
      socket.join(userId);
      console.log(`👤 User with ID: ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User Disconnected", socket.id);
    });
  });

  return io;
};