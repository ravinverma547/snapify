import { Request, Response } from "express";
import prisma from "../../config/prisma";

export class AdminController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          // Agar 'prisma generate' ke baad bhi yahan error aaye, 
          // toh samjho schema mein spelling mistake hai
          role: true, 
          createdAt: true,
        },
      });
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      // Fix: userId ko string confirm karne ke liye casting (as string)
      const userId = req.params.userId as string;

      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      await prisma.user.delete({ 
        where: { id: userId } 
      });

      res.status(200).json({ success: true, message: "User deleted by Admin" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}