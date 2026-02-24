import { Server, Socket } from "socket.io";
import prisma from "../config/prisma";

export const chatHandler = (io: Server, socket: Socket) => {
  // User ko uske personal room mein join karwana (for notifications)
  socket.on("setup", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} is online`);
    socket.emit("connected");
  });

  // Chat room join karna (Specific conversation ke liye)
  socket.on("join_chat", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // Typing start hona
  socket.on("typing", (room: string) => socket.in(room).emit("typing"));
  socket.on("stop_typing", (room: string) => socket.in(room).emit("stop_typing"));

  // Naya Message bhejna
  socket.on("new_message", async (newMessageReceived: any) => {
    const { conversationId, senderId, content, receiverId } = newMessageReceived;

    if (!conversationId || !senderId) return console.log("Invalid message data");

    // 1. Live message room mein bhejna (Real-time update)
    socket.in(conversationId).emit("message_received", newMessageReceived);

    // 2. Receiver ko notification bhejna (Agar wo kisi aur screen par hai)
    socket.in(receiverId).emit("notification_received", {
      type: "NEW_MESSAGE",
      from: senderId,
      text: content
    });
  });
};