import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class StreakController {
  // 1. User ki saari active streaks dekhna
  async getMyStreaks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: userId }, { addresseeId: userId }],
          status: "ACCEPTED",
          streak: { gt: 0 }, // Sirf wahi dikhao jo 0 se zyada hain
        },
        include: {
          requester: { select: { username: true, avatarUrl: true } },
          addressee: { select: { username: true, avatarUrl: true } },
        },
      });

      res.status(200).json({ success: true, data: friendships });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 2. Streak Update Logic (Internal Function)
   * Ye function tab call hoga jab koi Snap bhejega.
   */
  static async updateStreak(senderId: string, receiverId: string) {
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const twoDaysInMs = 48 * 60 * 60 * 1000;

    // Check friendship record
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: senderId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: senderId },
        ],
        status: "ACCEPTED",
      },
    });

    if (!friendship) return;

    const lastInteraction = new Date(friendship.lastInteraction).getTime();
    const timeDiff = now.getTime() - lastInteraction;

    if (timeDiff < oneDayInMs) {
      // 24 ghante ke andar snap bheja hai -> Streak maintain hai par increment nahi hogi (daily limit)
      return;
    } else if (timeDiff >= oneDayInMs && timeDiff < twoDaysInMs) {
      // 24 se 48 ghante ke beech bheja -> Streak +1!
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: {
          streak: { increment: 1 },
          lastInteraction: now,
        },
      });

      // User ka overall Snap Score bhi +10 kar dete hain (Bonus!)
      await prisma.user.updateMany({
        where: { id: { in: [senderId, receiverId] } },
        data: { score: { increment: 10 } }
      });
    } else {
      // 48 ghante se zyada ho gaye -> Streak Tut Gayi (Reset to 0)
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: {
          streak: 0,
          lastInteraction: now,
        },
      });
    }
  }
}