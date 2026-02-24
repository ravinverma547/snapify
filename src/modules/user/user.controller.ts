import { Request, Response } from "express";
import prisma from "../../config/prisma";

// 1. Apni profile details nikalna
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
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

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Profile Update
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { displayName, avatarUrl, bitmojiData } = req.body;
    const userId = req.user?.userId || req.user?.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { displayName, avatarUrl, bitmojiData },
      select: { // <--- Ye add karo password chhupane ke liye
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    score: true,
    streak: true,
    updatedAt: true
      }
    });

    res.status(200).json({ success: true, message: "Profile update ho gayi!", data: updatedUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. User Search
export const searchUsers = async (req: any, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user?.userId || req.user?.id;

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

    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};