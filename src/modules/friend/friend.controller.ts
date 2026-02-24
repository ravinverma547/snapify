import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class FriendController {
  // 1. Friend Request Bhejna
  async sendRequest(req: AuthRequest, res: Response) {
    try {
      const { addresseeId } = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) return res.status(401).json({ message: "Unauthorized" });

      if (requesterId === addresseeId) {
        return res.status(400).json({ message: "Bhai, khud ko add nahi kar sakte!" });
      }

      // Check karo kahin pehle se toh request nahi bheji?
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
          message: "Request pehle se bheji ja chuki hai ya aap pehle se dost hain!" 
        });
      }

      const friendship = await prisma.friendship.create({
        data: {
          requesterId,
          addresseeId,
          status: "PENDING",
        },
      });

      // Notification logic
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
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Friend Request Accept Karna
  async acceptRequest(req: AuthRequest, res: Response) {
    try {
      // Yahan Type casting (as string) add kar di hai
      const requestId = req.params.requestId as string; 
      const myId = req.user?.id;

      if (!requestId) {
          return res.status(400).json({ message: "Request ID zaroori hai!" });
      }

      // Pehle check karo request exists aur mere liye hi hai?
      const checkRequest = await prisma.friendship.findUnique({
        where: { id: requestId } // Ab ye error nahi dega
      });

      if (!checkRequest || checkRequest.addresseeId !== myId) {
        return res.status(404).json({ message: "Request nahi mili ya aap ise accept nahi kar sakte!" });
      }

      const friendship = await prisma.friendship.update({
        where: { id: requestId }, // Yahan bhi error fix ho jayega
        data: { status: "ACCEPTED" },
      });

      // Notification logic...
      await prisma.notification.create({
        data: {
          type: "REQUEST_ACCEPTED",
          content: `Aapki friend request accept kar li gayi hai! ✨`,
          senderId: myId!,
          receiverId: friendship.requesterId,
        },
      });

      res.status(200).json({ success: true, message: "Ab aap dost hain!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // 3. Mere saare doston ki list dekhna
  async getFriendsList(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

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

      // Data ko thoda clean kar dete hain taaki frontend ko sirf "Dost" ka object mile
      const friends = friendshipData.map(f => {
        return f.requesterId === myId ? f.addressee : f.requester;
      });

      res.status(200).json({ success: true, data: friends });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}