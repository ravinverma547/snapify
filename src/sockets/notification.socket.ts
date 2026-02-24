import { Server, Socket } from "socket.io";

export const notificationHandler = (io: Server, socket: Socket) => {
  socket.on("join_room", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });
};