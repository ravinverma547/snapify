import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ScoreController {
  // 1. Apna current score aur streak dekhna
  async getMyStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          score: true,
          streak: true,
          username: true,
          displayName: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User nahi mila" });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Score badhane ka logic (Ye internally call hoga jab snap bhejenge)
  // Par abhi testing ke liye hum ise ek route de dete hain
  async incrementScore(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { points } = req.body; // points: kitne se score badhana hai

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          score: {
            increment: points || 1
          }
        }
      });

      res.status(200).json({ 
        success: true, 
        message: "Score updated!", 
        newScore: updatedUser.score 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}