import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class BlockController {
  // 1. User ko Block karna
  async blockUser(req: AuthRequest, res: Response) {
    try {
      const { blockUserId } = req.body; // Jise block karna hai
      const myId = req.user?.id;       // Jo block kar raha hai

      if (myId === blockUserId) {
        return res.status(400).json({ success: false, message: "Apne aap ko block mat karo bhai!" });
      }

      // Check karo kya pehle se friendship exist karti hai?
      // FriendshipStatus ko update karke BLOCKED karenge
      await prisma.friendship.upsert({
        where: {
          requesterId_addresseeId: {
            requesterId: myId!,
            addresseeId: blockUserId,
          },
        },
        update: { status: "BLOCKED" },
        create: {
          requesterId: myId!,
          addresseeId: blockUserId,
          status: "BLOCKED",
        },
      });

      res.status(200).json({ success: true, message: "User blocked successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Blocked Users ki list dekhna
  async getBlockedUsers(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      const blockedList = await prisma.friendship.findMany({
        where: {
          requesterId: myId,
          status: "BLOCKED",
        },
        include: {
          addressee: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      res.status(200).json({ success: true, data: blockedList });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

 // 3. Unblock karna
  async unblockUser(req: AuthRequest, res: Response) {
    try {
      // Fix: 'as string' use karke TS ko batao ki ye array nahi hai
      const unblockUserId = req.params.unblockUserId as string;
      const myId = req.user?.id;

      if (!unblockUserId || !myId) {
        return res.status(400).json({ success: false, message: "IDs missing hain" });
      }

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
      res.status(500).json({ success: false, message: error.message });
    }
  }
}