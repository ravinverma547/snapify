import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { getAIResponse } from "../../config/ai";

export class MessageController {
  // 1. Message Bhejna (Text ya Media)
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      let { content, conversationId, type, mediaUrl } = req.body;
      const senderId = req.user?.id;
      const file = req.file;

      if (!conversationId) {
        return res.status(400).json({ success: false, message: "Conversation ID zaroori hai" });
      }

      // Handle file upload
      if (file) {
        mediaUrl = file.path;
        const mime = file.mimetype;
        if (mime.startsWith("image")) type = "IMAGE";
        else if (mime.startsWith("video")) type = "VIDEO";
        else if (mime.startsWith("audio")) type = "AUDIO";
      }

      if (!content && !mediaUrl) {
        return res.status(400).json({ success: false, message: "Kuch toh likho ya media bhejo!" });
      }

      // 1. Check karo ki conversation exist karti hai
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId as string }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation nahi mili" });
      }

      // 2. Block + Friends-only check (for 1-on-1 chats only)
      if (!conversation.isGroup) {
        const otherUserId = conversation.participantIds.find((pid: string) => pid !== senderId);
        if (otherUserId) {
          const aiUser = await prisma.user.findUnique({ where: { username: "my_ai" } });
          const isAiChat = aiUser && otherUserId === aiUser.id;

          if (!isAiChat) {
            const relationship = await prisma.friendship.findFirst({
              where: {
                OR: [
                  { requesterId: senderId, addresseeId: otherUserId },
                  { requesterId: otherUserId, addresseeId: senderId }
                ]
              }
            });

            // Blocked check (either side)
            if (relationship?.status === "BLOCKED") {
              return res.status(403).json({
                success: false,
                message: "Block status active hai. Message nahi kar sakte."
              });
            }

            // Friends-only: dono ACCEPTED friends hone chahiye
            if (!relationship || relationship.status !== "ACCEPTED") {
              return res.status(403).json({
                success: false,
                message: "Sirf friends ko message kar sakte hain. Pehle friend request bhejein."
              });
            }
          }
        }
      } else {
        // For Group chats: Only Ensure sender is in the group participantIds
        if (!conversation.participantIds.includes(senderId!)) {
           return res.status(403).json({
             success: false,
             message: "Aap is group ke member nahi hain."
           });
        }
      }

      // 3. Naya message banao
      const newMessage = await prisma.message.create({
        data: {
          content,
          mediaUrl,
          type: type || "TEXT",
          senderId: senderId!,
          conversationId: conversationId as string,
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } }
        }
      });

      // 4. Conversation ki 'updatedAt' update karo
      await prisma.conversation.update({
        where: { id: conversationId as string },
        data: { updatedAt: new Date() }
      });

      res.status(201).json({ success: true, message: "Message bhej diya gaya", data: newMessage });

      // 5. My AI Response Logic (Async so it doesn't block the initial user response)
      if (!conversation.isGroup && content) {
        const aiUser = await prisma.user.findUnique({ where: { username: "my_ai" } });
        const otherUserId = conversation.participantIds.find((pid: string) => pid !== senderId);
        
        if (aiUser && otherUserId === aiUser.id) {
          try {
            console.log(`🤖 My AI Response cycle started...`);
            const io = req.app.get("io");
            if (io) {
               io.to(senderId!).emit("typing_status", { senderId: aiUser.id, isTyping: true });
            }

            const responseText = await getAIResponse(content);
            console.log(`✅ My AI Replied: [${responseText}]`);

            const aiMessage = await prisma.message.create({
              data: {
                content: responseText,
                type: "TEXT",
                senderId: aiUser.id,
                conversationId: conversationId as string,
              }
            });

            await prisma.conversation.update({
              where: { id: conversationId as string },
              data: { updatedAt: new Date() }
            });

            if (io) {
              const cleanSenderId = senderId!.toString();
              io.to(cleanSenderId).emit("message_received", {
                 senderId: aiUser.id,
                 content: responseText,
                 receiverId: cleanSenderId,
                 messageId: aiMessage.id
              });
              io.to(cleanSenderId).emit("typing_status", { senderId: aiUser.id, isTyping: false });
              console.log(`🤖 Real-time response sent to ${cleanSenderId}`);
            }
          } catch (aiErr) {
            console.error("❌ My AI Error:", aiErr);
            const io = req.app.get("io");
            if (io && aiUser) io.to(senderId!).emit("typing_status", { senderId: aiUser.id, isTyping: false });
          }
        }
      }

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Chat ki saari Messages fetch karna (History)
  async getChatMessages(req: AuthRequest, res: Response) {
    try {
      // FIX: 'as string' casting taaki TS error na de
      const conversationId = req.params.conversationId as string;
      const myId = req.user?.id;

      if (!conversationId) {
        return res.status(400).json({ success: false, message: "Conversation ID missing hai" });
      }

      // 1. Messages fetch karo
      const messages = await prisma.message.findMany({
        where: { 
          conversationId: conversationId 
        },
        include: {
          sender: { 
            select: { 
              id: true, 
              username: true, 
              avatarUrl: true 
            } 
          },
          reactions: true
        },
        orderBy: { 
          createdAt: 'asc' // Purani pehle, nayi baad mein
        }
      });

      res.status(200).json({ 
        success: true, 
        count: messages.length, 
        data: messages 
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Message ko unsend (delete) karna
  async unsendMessage(req: AuthRequest, res: Response) {
    try {
      const messageId = req.params.messageId;
      const myId = req.user?.id;

      if (!messageId) {
        return res.status(400).json({ success: false, message: "Message ID zaroori hai" });
      }

      // 1. Message check
      const message = await prisma.message.findUnique({
        where: { id: messageId as string }
      });

      if (!message) {
        return res.status(404).json({ success: false, message: "Message nahi mila" });
      }

      // 2. Sirf apna bheja hua message delete kar sakte hain
      if (message.senderId !== myId) {
        return res.status(403).json({ success: false, message: "Aap sirf apne message unsend kar sakte hain" });
      }

      // 3. Delete message and its reactions
      await prisma.reaction.deleteMany({
        where: { messageId: messageId as string }
      });

      await prisma.message.delete({
        where: { id: messageId as string }
      });

      res.status(200).json({ success: true, message: "Message unsend ho gaya" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}