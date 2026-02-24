import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";

export class SnapController {
  async sendSnap(req: AuthRequest, res: Response) {
    try {
      const { receiverId, viewDuration, mediaType } = req.body;
      const senderId = req.user?.id;
      const file = req.file;

      if (!file) throw new ApiError(400, "Snap file upload nahi hui!");

      const snap = await prisma.snap.create({
        data: {
          url: (file as any).path,
          mediaType: mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
          viewDuration: parseInt(viewDuration) || 10,
          senderId: senderId!,
          receiverId: receiverId,
          status: "SENT",
        },
      });

      // User score update
      await prisma.user.update({
        where: { id: senderId },
        data: { score: { increment: 1 } }
      });

      return res.status(201).json(new ApiResponse(201, snap, "Snap sent successfully!"));
    } catch (error: any) {
      res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
  }

  async getMySnaps(req: AuthRequest, res: Response) {
    const snaps = await prisma.snap.findMany({
      where: { receiverId: req.user?.id, status: { not: "OPENED" } },
      include: { sender: { select: { username: true, displayName: true } } }
    });
    return res.status(200).json(new ApiResponse(200, snaps));
  }
}