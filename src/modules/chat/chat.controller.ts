import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ChatController {
  // 1. Nayi Conversation shuru karna ya existing dhoondna
  async accessConversation(req: AuthRequest, res: Response) {
    try {
      const { receiverId } = req.body;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!receiverId) return res.status(400).json({ success: false, message: "Receiver ID zaroori hai" });

      // Step 1: Existing conversation dhoondo
      let conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participantIds: {
            hasEvery: [myId, receiverId]
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
            participantIds: [myId, receiverId],
            isGroup: false,
          },
          include: {
            messages: { take: 1, orderBy: { createdAt: 'desc' } }, 
            participants: { select: { id: true, username: true, avatarUrl: true } }
          }
        });
      }

      res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
      console.error("[ChatController.accessConversation] Error:", error);
      res.status(500).json({ success: false, message: "Server error while accessing conversation" });
    }
  }

  // 2. Apni saari Chats (Conversations) ki list dekhna
  async getMyChats(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });

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

      // Ensure My AI chat exists in my list
      try {
        const aiUser = await prisma.user.findUnique({ where: { username: "my_ai" } });
        if (aiUser && aiUser.id !== myId) {
          const hasAiChat = (chats || []).some(c => !c.isGroup && c.participantIds.includes(aiUser.id));
          if (!hasAiChat) {
             const newAiChat = await prisma.conversation.create({
                data: {
                  isGroup: false,
                  participantIds: [myId, aiUser.id]
                },
                include: {
                  participants: { select: { id: true, username: true, avatarUrl: true } },
                  messages: { take: 1, orderBy: { createdAt: 'desc' } }
                }
             });
             chats.unshift(newAiChat);
          }
        }
      } catch (e) {
        console.error("[ChatController.getMyChats] My AI injection failed:", e);
      }

      res.status(200).json({ success: true, data: chats || [] });
    } catch (error: any) {
      console.error("[ChatController.getMyChats] Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching chats" });
    }
  }

  // 3. Poori Chat (1-on-1) delete karna
  async deleteChat(req: AuthRequest, res: Response) {
    try {
      const chatId = req.params.chatId as string;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!chatId) return res.status(400).json({ success: false, message: "Chat ID missing" });

      const chat = await prisma.conversation.findUnique({ where: { id: chatId } });
      if (!chat) return res.status(404).json({ success: false, message: "Chat nahi mili" });
      if (chat.isGroup) return res.status(400).json({ success: false, message: "Ye group chat hai, isse group settings se delete karein" });
      if (!chat.participantIds.includes(myId)) return res.status(403).json({ success: false, message: "Aap is chat ka hissa nahi hain" });

      const messages = await prisma.message.findMany({ where: { conversationId: chatId }});
      const messageIds = (messages || []).map(m => m.id);

      await prisma.reaction.deleteMany({ where: { messageId: { in: messageIds } } });
      await prisma.message.deleteMany({ where: { conversationId: chatId } });
      
      await prisma.conversation.delete({ where: { id: chatId } });

      res.status(200).json({ success: true, message: "Chat delete ho gayi" });
    } catch (error: any) {
      console.error("[ChatController.deleteChat] Error:", error);
      res.status(500).json({ success: false, message: "Server error while deleting chat" });
    }
  }
}