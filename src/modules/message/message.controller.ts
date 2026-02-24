import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class MessageController {
  // 1. Message Bhejna (Text ya Media)
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { content, conversationId, type, mediaUrl } = req.body;
      const senderId = req.user?.id;

      // Basic Validation
      if (!conversationId) {
        return res.status(400).json({ success: false, message: "Conversation ID zaroori hai" });
      }

      if (!content && !mediaUrl) {
        return res.status(400).json({ success: false, message: "Kuch toh likho ya media bhejo!" });
      }

      // 1. Check karo ki kya conversation exist karti hai
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId as string }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation nahi mili" });
      }

      // 2. Naya message banao
      const newMessage = await prisma.message.create({
        data: {
          content,
          mediaUrl,
          type: type || "TEXT",
          senderId: senderId!,
          conversationId: conversationId as string,
        },
        include: {
          sender: { 
            select: { 
              id: true, 
              username: true, 
              avatarUrl: true 
            } 
          }
        }
      });

      // 3. Conversation ki 'updatedAt' field update karo (taaki chat list mein ye top par aaye)
      await prisma.conversation.update({
        where: { id: conversationId as string },
        data: { updatedAt: new Date() }
      });

      res.status(201).json({ 
        success: true, 
        message: "Message bhej diya gaya", 
        data: newMessage 
      });

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
          }
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
}