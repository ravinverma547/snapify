import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ChatController {
  // 1. Nayi Conversation shuru karna ya existing dhoondna
 async accessConversation(req: AuthRequest, res: Response) {
    try {
      const { receiverId } = req.body;
      const myId = req.user?.id;

      if (!receiverId) return res.status(400).json({ message: "Receiver ID zaroori hai" });

      // Step 1: Existing conversation dhoondo
      let conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participantIds: {
            hasEvery: [myId!, receiverId]
          }
        },
        include: {
          messages: { take: 1, orderBy: { createdAt: 'desc' } }, 
          participants: { select: { id: true, username: true, avatarUrl: true } }
        }
      });

      // Step 2: Agar nahi milti toh nayi banao
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participantIds: [myId!, receiverId],
            isGroup: false,
          },
          // FIX: Yahan bhi 'messages' include karna hoga taaki Type mismatch na ho
          include: {
            messages: { take: 1, orderBy: { createdAt: 'desc' } }, 
            participants: { select: { id: true, username: true, avatarUrl: true } }
          }
        });
      }

      res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Apni saari Chats (Conversations) ki list dekhna
  async getMyChats(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      const chats = await prisma.conversation.findMany({
        where: {
          participantIds: { has: myId }
        },
        include: {
          participants: { select: { id: true, username: true, avatarUrl: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({ success: true, data: chats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}