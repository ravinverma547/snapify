import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ReactionController {
async toggleReaction(req: AuthRequest, res: Response) {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user?.id;
    const io = req.app.get("socketio");

    // 🔥 MAGIC LINES: Agar ID database wali nahi hai, toh seedha socket chala do
    // Isse aapka niche ka Prisma code crash nahi hoga
    if (messageId.startsWith("msg-")) {
        if (io) io.emit("reaction_updated", { messageId, emoji, actionType: "ADDED" });
        return res.status(200).json({ success: true, message: "Socket updated" });
    }

      // 1. Message check karo
      // Note: messageId as string use kiya hai Type Error hatane ke liye
      const message = await prisma.message.findUnique({
        where: { id: messageId as string },
        select: { conversationId: true, senderId: true },
      });

      if (!message) {
        return res.status(404).json({ success: false, message: "Message nahi mila" });
      }

      // 2. Check existing reaction
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          userId_messageId: {
            userId: userId!,
            messageId: messageId as string,
          },
        },
      });

      let actionType: "ADDED" | "REMOVED" | "UPDATED";
      let finalData;

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await prisma.reaction.delete({ where: { id: existingReaction.id } });
          actionType = "REMOVED";
          finalData = { message: "Removed" };
        } else {
          const updated = await prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { emoji },
          });
          actionType = "UPDATED";
          finalData = { data: updated };
        }
      } else {
        const newReaction = await prisma.reaction.create({
          data: {
            emoji,
            userId: userId!,
            messageId: messageId as string,
          },
        });
        actionType = "ADDED";
        finalData = { data: newReaction };
      }

      // --- ⚡ SOCKET REAL-TIME UPDATE ---
      if (io) {
        io.to(message.conversationId).emit("reaction_updated", {
          messageId,
          emoji,
          userId,
          actionType,
        });

        if (message.senderId !== userId && actionType !== "REMOVED") {
          await prisma.notification.create({
            data: {
              type: "REACTION",
              content: `Someone reacted ${emoji} to your message`,
              senderId: userId!,
              receiverId: message.senderId,
            },
          });

          io.to(message.senderId).emit("notification_received", {
            title: "New Reaction!",
            message: `Someone reacted ${emoji} to your message`,
          });
        }
      }

      return res.status(200).json({ success: true, ...finalData, actionType });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMessageReactions(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;

      // FIX: messageId ko explicitly string mein convert kiya Type Error hatane ke liye
      const idToSearch = Array.isArray(messageId) ? messageId[0] : messageId;

      const reactions = await prisma.reaction.findMany({
        where: { messageId: idToSearch },
        include: {
          user: { select: { username: true, avatarUrl: true } },
        },
      });
      res.status(200).json({ success: true, data: reactions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}