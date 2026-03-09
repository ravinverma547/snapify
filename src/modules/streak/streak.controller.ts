import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class StreakController {
  // 1. User ki saari active streaks dekhna (API Endpoint)
  async getMyStreaks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: userId }, { addresseeId: userId }],
          status: "ACCEPTED",
          streak: { gt: 0 },
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
   * 2. Streak Update Logic (Internal Static Function)
   * Isko SnapController se call karte hain.
   */
  static async updateStreak(senderId: string, receiverId: string) {
    try {
      const now = new Date();
      // TESTING: sirf 1 second ka gap rakha hai taaki Postman pe turant result dikhe
      const minGap = 1000; 
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const twoDaysInMs = 48 * 60 * 60 * 1000;

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: senderId, addresseeId: receiverId },
            { requesterId: receiverId, addresseeId: senderId },
          ],
          status: "ACCEPTED",
        },
      });

      if (!friendship) {
        console.log("Friendship status 'ACCEPTED' nahi mili.");
        return;
      }

      const lastInteraction = new Date(friendship.lastInteraction).getTime();
      const timeDiff = now.getTime() - lastInteraction;

      // --- STREAK LOGIC ---

      if (timeDiff < minGap) {
        // Bahut jaldi snap bhej di (Dhyan rakho: Real app mein yahan 24h ka gap hona chahiye)
        console.log("Wait for a few seconds to update streak again!");
        return;
      } 
      else if (timeDiff >= minGap && timeDiff < twoDaysInMs) {
        // Streak badhao
        await prisma.friendship.update({
          where: { id: friendship.id },
          data: {
            streak: { increment: 1 },
            lastInteraction: now,
          },
        });

        // Bonus: Dono users ka score +10
        await prisma.user.updateMany({
          where: { id: { in: [senderId, receiverId] } },
          data: { score: { increment: 10 } },
        });

        console.log("🔥 Streak Incremented and Score +10!");
      } 
      else {
        // 48 hours se zyada ho gaye -> Streak Tut Gayi
        await prisma.friendship.update({
          where: { id: friendship.id },
          data: {
            streak: 0,
            lastInteraction: now,
          },
        });
        console.log("💀 Streak Reset to 0 (Too much gap)");
      }
    } catch (error) {
      console.error("Streak Update Error:", error);
    }
  }
}