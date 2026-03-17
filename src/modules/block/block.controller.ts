import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class BlockController {
  // 1. User ko Block karna
  async blockUser(req: AuthRequest, res: Response) {
    try {
      const { blockUserId } = req.body;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!blockUserId) return res.status(400).json({ success: false, message: "Target user ID missing" });

      if (myId === blockUserId) {
        return res.status(400).json({ success: false, message: "Apne aap ko block mat karo!" });
      }

      // Pehle koi bhi existing friendship record delete karo (ACCEPTED, PENDING dono)
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: myId, addresseeId: blockUserId },
            { requesterId: blockUserId, addresseeId: myId }
          ]
        }
      });

      // Ab BLOCKED record banao (sirf ek direction: myId ne blockUserId ko block kiya)
      await prisma.friendship.create({
        data: {
          requesterId: myId,
          addresseeId: blockUserId,
          status: "BLOCKED",
        }
      });

      res.status(200).json({ success: true, message: "User blocked successfully" });
    } catch (error: any) {
      console.error("[BlockController.blockUser] Error:", error);
      res.status(500).json({ success: false, message: "Server error while blocking user" });
    }
  }

  // 2. Blocked Users ki list dekhna
  async getBlockedUsers(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const blockedList = await prisma.friendship.findMany({
        where: { requesterId: myId, status: "BLOCKED" },
        include: {
          addressee: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      res.status(200).json({ success: true, data: blockedList || [] });
    } catch (error: any) {
      console.error("[BlockController.getBlockedUsers] Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching blocked users" });
    }
  }

  // 3. Unblock karna
  async unblockUser(req: AuthRequest, res: Response) {
    try {
      const unblockUserId = req.params.unblockUserId as string;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!unblockUserId) return res.status(400).json({ success: false, message: "Target user ID missing" });

      const result = await prisma.friendship.deleteMany({
        where: {
          requesterId: myId,
          addresseeId: unblockUserId,
          status: "BLOCKED"
        }
      });

      if (result.count === 0) {
        return res.status(404).json({ success: false, message: "Block record nahi mila" });
      }

      res.status(200).json({ success: true, message: "User unblocked successfully" });
    } catch (error: any) {
      console.error("[BlockController.unblockUser] Error:", error);
      res.status(500).json({ success: false, message: "Server error while unblocking user" });
    }
  }
}