import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ReactionController {
  async toggleReaction(req: AuthRequest, res: Response) {
    try {
      const { messageId, emoji } = req.body;
      const userId = req.user?.id;

      if (!messageId || !emoji) {
        return res.status(400).json({ success: false, message: "Details missing hain" });
      }

      // Check existing reaction
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          userId_messageId: {
            userId: userId!,
            messageId: messageId as string,
          },
        },
      });

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await prisma.reaction.delete({ where: { id: existingReaction.id } });
          return res.status(200).json({ success: true, message: "Removed" });
        } 
        
        const updated = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { emoji },
        });
        return res.status(200).json({ success: true, data: updated });
      }

      // Create new
      const newReaction = await prisma.reaction.create({
        data: {
          emoji,
          userId: userId!,
          messageId: messageId as string,
        },
      });

      // Fixed: req.user.username ki jagah DB se user fetch kar lo agar notification bhejni hai
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (message && message.senderId !== userId) {
        await prisma.notification.create({
          data: {
            type: "REACTION",
            content: `Alag user ne aapke message par ${emoji} react kiya`,
            senderId: userId!,
            receiverId: message.senderId
          }
        });
      }

      res.status(201).json({ success: true, data: newReaction });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMessageReactions(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const reactions = await prisma.reaction.findMany({
        where: { messageId: messageId as string },
        include: {
          user: { select: { username: true, avatarUrl: true } }
        }
      });
      res.status(200).json({ success: true, data: reactions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}