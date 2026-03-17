import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class FriendController {
  // 1. Friend Request Bhejna
  async sendRequest(req: AuthRequest, res: Response) {
    try {
      const { addresseeId } = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!addresseeId) return res.status(400).json({ success: false, message: "Addressee ID missing" });

      if (requesterId === addresseeId) {
        return res.status(400).json({ success: false, message: "Khud ko add nahi kar sakte!" });
      }

      // Block check: agar kisi ne bhi block kiya hai toh request nahi bheji ja sakti
      const blockRecord = await prisma.friendship.findFirst({
        where: {
          status: "BLOCKED",
          OR: [
            { requesterId, addresseeId },
            { requesterId: addresseeId, addresseeId: requesterId }
          ]
        }
      });
      if (blockRecord) {
        return res.status(403).json({ success: false, message: "Is user ko request nahi bhej sakte." });
      }

      const existingRequest = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId },
            { requesterId: addresseeId, addresseeId: requesterId }
          ]
        }
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: "Request pehle se bheji ja chuki hai ya aap pehle se dost hain!",
          status: existingRequest.status
        });
      }

      const friendship = await prisma.friendship.create({
        data: { requesterId, addresseeId, status: "PENDING" },
      });

      await prisma.notification.create({
        data: {
          type: "FRIEND_REQUEST",
          content: `Aapko ek nayi friend request aayi hai!`,
          senderId: requesterId,
          receiverId: addresseeId,
        },
      });

      res.status(201).json({ success: true, data: friendship });
    } catch (error: any) {
      console.error("[FriendController.sendRequest] Error:", error);
      res.status(500).json({ success: false, message: "Server error while sending request" });
    }
  }

  // 2. Friend Request Accept Karna
  async acceptRequest(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.requestId as string;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!requestId) {
        return res.status(400).json({ success: false, message: "Request ID missing" });
      }

      const checkRequest = await prisma.friendship.findUnique({
        where: { id: requestId }
      });

      if (!checkRequest || checkRequest.addresseeId !== myId) {
        return res.status(404).json({ success: false, message: "Request nahi mili ya aap ise accept nahi kar sakte!" });
      }

      const friendship = await prisma.friendship.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      await prisma.notification.create({
        data: {
          type: "REQUEST_ACCEPTED",
          content: `Aapki friend request accept kar li gayi hai! ✨`,
          senderId: myId,
          receiverId: friendship.requesterId,
        },
      });

      res.status(200).json({ success: true, message: "Ab aap dost hain!" });
    } catch (error: any) {
      console.error("[FriendController.acceptRequest] Error:", error);
      res.status(500).json({ success: false, message: "Server error while accepting request" });
    }
  }

  // 3. Friend Request Reject Karna
  async rejectRequest(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.requestId as string;
      const myId = req.user?.id;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!requestId) return res.status(400).json({ success: false, message: "Request ID missing" });

      const checkRequest = await prisma.friendship.findUnique({
        where: { id: requestId }
      });

      if (!checkRequest || checkRequest.addresseeId !== myId) {
        return res.status(404).json({ success: false, message: "Request nahi mili!" });
      }

      await prisma.friendship.delete({ where: { id: requestId } });

      res.status(200).json({ success: true, message: "Request reject kar di gayi." });
    } catch (error: any) {
      console.error("[FriendController.rejectRequest] Error:", error);
      res.status(500).json({ success: false, message: "Server error while rejecting request" });
    }
  }

  // 4. Mere saare doston ki list
  async getFriendsList(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const friendshipData = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: myId, status: "ACCEPTED" },
            { addresseeId: myId, status: "ACCEPTED" }
          ]
        },
        include: {
          requester: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
          addressee: { select: { id: true, username: true, avatarUrl: true, displayName: true } }
        }
      });

      const friends = (friendshipData || []).map(f => {
        return f.requesterId === myId ? f.addressee : f.requester;
      });

      res.status(200).json({ success: true, data: friends });
    } catch (error: any) {
      console.error("[FriendController.getFriendsList] Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching friends list" });
    }
  }

  // 5. Pending Requests (Mujhe jo requests aai hain)
  async getPendingRequests(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const pendingRequests = await prisma.friendship.findMany({
        where: { addresseeId: myId, status: "PENDING" },
        include: {
          requester: { select: { id: true, username: true, avatarUrl: true, displayName: true } }
        },
        orderBy: { createdAt: "desc" }
      });

      res.status(200).json({ success: true, data: pendingRequests || [] });
    } catch (error: any) {
      console.error("[FriendController.getPendingRequests] Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching pending requests" });
    }
  }

  // 6. Friendship Status Check (kisi specific user ke saath)
  async getFriendshipStatus(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      const userId = req.params.userId as string;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: myId, addresseeId: userId },
            { requesterId: userId, addresseeId: myId }
          ]
        }
      });

      if (!friendship) {
        return res.status(200).json({ success: true, data: { status: "NONE" } });
      }

      const isSender = friendship.requesterId === myId;
      res.status(200).json({
        success: true,
        data: { status: friendship.status, requestId: friendship.id, isSender }
      });
    } catch (error: any) {
      console.error("[FriendController.getFriendshipStatus] Error:", error);
      res.status(500).json({ success: false, message: "Server error while checking friendship status" });
    }
  }

  // 7. Unfriend karna
  async unfriendUser(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      const friendId = req.params.friendId as string;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!friendId) return res.status(400).json({ success: false, message: "Friend ID missing" });

      const deleted = await prisma.friendship.deleteMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { requesterId: myId, addresseeId: friendId },
            { requesterId: friendId, addresseeId: myId }
          ]
        }
      });

      if (deleted.count === 0) {
        return res.status(404).json({ success: false, message: "Friendship nahi mili" });
      }

      res.status(200).json({ success: true, message: "Friend remove kar diya. Ab messaging band hai." });
    } catch (error: any) {
      console.error("[FriendController.unfriendUser] Error:", error);
      res.status(500).json({ success: false, message: "Server error while unfriending" });
    }
  }
}