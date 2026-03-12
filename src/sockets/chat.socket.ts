import { Server, Socket } from "socket.io";

export const chatHandler = (io: Server, socket: Socket) => {
  
  // 1. SETUP: Jab user app kholta hai, wo apne naam ke room mein baith jata hai
  socket.on("setup", (userId: string) => {
    if (!userId) return;
    const cleanUserId = userId.toString().trim().replace(/['"]+/g, '');
    socket.join(cleanUserId); 
    console.log(`✅ ${cleanUserId} is online (for personal chats)`);
  });

  // 2. JOIN GROUP: Jab user kisi group chat par click karta hai
  socket.on("join_chat", (groupId: string) => {
    if (!groupId) return;
    const cleanGroupId = groupId.toString().trim().replace(/['"]+/g, '');
    socket.join(cleanGroupId);
    console.log(`🏠 User entered Group Room: ${cleanGroupId}`);
  });

  // 3. PERSONAL LOGIC (Direct to Person)
  socket.on("new_message", (payload: any) => {
    const { senderId, content, receiverId, messageId } = payload;
    const cleanReceiverId = receiverId?.toString().trim();

    if (!cleanReceiverId) {
      console.warn('new_message missing receiverId:', payload);
      return;
    }

    // Us bande ki personal ID par message aur notification bhejo
    io.to(cleanReceiverId).emit("message_received", { senderId, content, receiverId: cleanReceiverId, messageId, roomId: payload.roomId });
    io.to(cleanReceiverId).emit("notification_received", {
      title: `Private Snap from ${senderId}`,
      message: content,
      receiverId: cleanReceiverId
    });
    console.log(`👤 Private: ${senderId} -> ${cleanReceiverId}`);
  });

  // 4. GROUP LOGIC (Broadcast to Room)
  socket.on("new_group_message", (payload: any) => {
    const { groupId, senderId, senderName, content, messageId } = payload;
    const cleanGroupId = groupId?.trim();

    // Poore group room mein message aur notification bhejo (Except sender)
    socket.to(cleanGroupId).emit("group_message_received", {
      senderName,
      content,
      groupId: cleanGroupId,
      messageId,
      roomId: cleanGroupId // Add roomId for frontend consistency
    });

    socket.to(cleanGroupId).emit("notification_received", {
      title: `Group: ${cleanGroupId}`,
      message: `${senderName}: ${content}`
    });
    console.log(`👥 Group: ${senderName} sent msg to ${cleanGroupId}`);
  });

  // ⚡ 5. REACTION LOGIC (Personal + Group Broadcast)
  // Amit double click karega toh ye event chalega aur Ravin ko dikhayega
  socket.on("send_reaction", (payload: any) => {
    const { messageId, emoji, userId, roomId, actionType } = payload;
    
    if (!roomId) return;
    const cleanRoomId = roomId.toString().trim().replace(/['"]+/g, '');

    // socket.to(room) ka matlab sender ko chhod kar room mein baaki sabko bhej do
    socket.to(cleanRoomId).emit("reaction_updated", {
      messageId,
      emoji,
      userId,
      actionType // "ADDED" ya "REMOVED"
    });

    console.log(`❤️ Reaction: ${userId} ${actionType} ${emoji} on ${messageId} in room ${cleanRoomId}`);
  });

  // 📞 6. WebRTC CALLING LOGIC (Signaling Handshake)
  
  // A initiate call kar raha hai B ko
  socket.on("call_user", (data: { to: string; from: any; type: 'VOICE' | 'VIDEO'; roomId: string }) => {
    const { to, from, type, roomId } = data;
    if (!to) return;
    console.log(`📞 Call Request: ${from.username} -> ${to} (${type})`);
    io.to(to.toString()).emit("incoming_call", { from, type, roomId });
  });

  // B call accept ya reject kar raha hai
  socket.on("call_response", (data: { to: string; fromId: string; accepted: boolean; roomId: string }) => {
    const { to, accepted, roomId } = data;
    if (!to) return;
    console.log(`📞 Call Response: To ${to} -> Accepted: ${accepted}`);
    io.to(to.toString()).emit("call_answered", { accepted, roomId });
  });

  // WebRTC Signaling Data (Offer, Answer, ICE Candidates) relay karna
  socket.on("webrtc_signal", (data: { to: string; signal: any; roomId: string }) => {
    const { to, signal, roomId } = data;
    if (!to) return;
    // Bhejne wala A hai, milne wala B (signal can be Offer/Answer/ICE)
    io.to(to.toString()).emit("webrtc_signal_received", { signal, fromId: socket.id, roomId });
  });

  // Call End karna
  socket.on("end_call", (data: { to: string; roomId: string }) => {
    const { to, roomId } = data;
    if (!to) return;
    console.log(`📞 Call Ended in room ${roomId}`);
    io.to(to.toString()).emit("call_ended", { roomId });
  });
};