import { Server, Socket } from "socket.io";

export const notificationHandler = (io: Server, socket: Socket) => {
  // User ko uske "Personal ID" wale room mein join karwana
  socket.on("setup_notifications", (userId: string) => {
    const cleanUserId = userId.toString().replace(/['"]+/g, '');
    socket.join(cleanUserId);
    console.log(`🔔 Notifications active for: ${cleanUserId}`);
  });

  // Jab koi naya message aaye, toh receiver ko personal alert bhejna
  socket.on("send_notification", (data: any) => {
    const { receiverId, senderName, content } = data;
    
    if (!receiverId) return console.warn("[NotificationSocket] receiverId missing");

    const cleanReceiverId = receiverId.toString().trim().replace(/['"]+/g, '');

    // Sirf us bande ko bhejona jiski ID receiverId hai
    io.to(cleanReceiverId).emit("notification_received", {
      title: `Message from ${senderName || 'someone'}`,
      message: content || 'New notification',
      time: new Date()
    });
    console.log(`[Socket] Notification alert sent to: ${cleanReceiverId}`);
  });
};