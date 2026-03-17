import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

// 1. Apni profile details nikalna
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User session missing" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        score: true,
        streak: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error("[UserController.getMe] Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching profile" });
  }
};

// 2. Profile Update
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, avatarUrl, bitmojiData } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { displayName, avatarUrl, bitmojiData },
      select: { 
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        score: true,
        streak: true,
        updatedAt: true
      }
    });

    res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error: any) {
    console.error("[UserController.updateProfile] Error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// 3. User Search
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query as string, mode: 'insensitive' } },
          { displayName: { contains: query as string, mode: 'insensitive' } }
        ],
        NOT: { id: userId }
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true
      },
      take: 10
    });

    res.status(200).json({ success: true, data: users || [] });
  } catch (error: any) {
    console.error("[UserController.searchUsers] Error:", error);
    res.status(500).json({ success: false, message: "Error searching users" });
  }
};

// 4. Get specific user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    
    if (!id) return res.status(400).json({ success: false, message: "Target ID missing" });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        score: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error("[UserController.getUserProfile] Error:", error);
    res.status(500).json({ success: false, message: "Error fetching user profile" });
  }
};