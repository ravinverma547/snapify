import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { StreakController } from "../streak/streak.controller"; 

export class SnapController {
  // 1. Send Snap
  async sendSnap(req: AuthRequest, res: Response) {
    try {
      const { receiverId, viewDuration, mediaType } = req.body;
      const senderId = req.user?.id;
      const file = req.file;

      if (!senderId) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
      if (!file) throw new ApiError(400, "Snap file upload nahi hui!");
      if (!receiverId) throw new ApiError(400, "Receiver ID missing hai.");

      const snap = await prisma.snap.create({
        data: {
          url: file.path,
          mediaType: mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
          viewDuration: parseInt(viewDuration) || 10,
          senderId: senderId,
          receiverId: receiverId,
          status: "SENT",
        },
      });

      await prisma.user.update({
        where: { id: senderId },
        data: { score: { increment: 1 } }
      });

      // Snap bhejte hi streak update call karo
      await StreakController.updateStreak(senderId, receiverId);

      return res.status(201).json(new ApiResponse(201, snap, "Snap bhej di gayi!"));
    } catch (error: any) {
      console.error("[SnapController.sendSnap] Error:", error);
      res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
  }

  // 2. Get My Snaps
  getMySnaps = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));

      const snaps = await prisma.snap.findMany({
        where: { receiverId: userId, status: "SENT" },
        include: { 
          sender: { select: { username: true, displayName: true } } 
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(new ApiResponse(200, snaps || [], "Snaps fetched!"));
    } catch (error: any) {
      console.error("[SnapController.getMySnaps] Error:", error);
      res.status(500).json(new ApiResponse(500, null, "Server error while fetching snaps"));
    }
  };

  // 3. Open Snap (Fixed Logic)
  openSnap = async (req: AuthRequest, res: Response) => {
    try {
      const { snapId } = req.params;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));

      if (!snapId) return res.status(400).json(new ApiResponse(400, null, "Snap ID missing"));
      
      const updatedSnap = await prisma.snap.update({
        where: { 
          id: snapId as string,
          receiverId: userId // Ensure user only opens snaps sent to them
        },
        data: { 
          status: "OPENED", 
          openedAt: new Date() 
        }
      });

      return res.status(200).json(new ApiResponse(200, updatedSnap, "Snap marked as OPENED!"));
    } catch (error: any) {
      console.error("[SnapController.openSnap] Error:", error);
      res.status(500).json(new ApiResponse(500, null, "Snap ID galat hai ya snap nahi mili."));
    }
  };
}