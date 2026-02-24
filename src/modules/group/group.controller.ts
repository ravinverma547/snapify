import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class GroupController {
  // 1. Naya Group banana
  async createGroup(req: AuthRequest, res: Response) {
    try {
      const { name, participantIds } = req.body; // participantIds: string[] (Friends ki IDs)
      const myId = req.user?.id;

      if (!name || !participantIds || participantIds.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: "Group ke liye naam aur kam se kam 2 aur log chahiye!" 
        });
      }

      // Khud ki ID ko participants list mein add karna mat bhoolna
      const uniqueParticipants = Array.from(new Set([...participantIds, myId!]));

      const group = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          participantIds: uniqueParticipants,
        },
        include: {
          participants: {
            select: { id: true, username: true, avatarUrl: true }
          }
        }
      });

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Mere saare Groups ki list
  async getMyGroups(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      const groups = await prisma.conversation.findMany({
        where: {
          isGroup: true,
          participantIds: { has: myId }
        },
        include: {
          participants: { select: { id: true, username: true } },
          _count: { select: { messages: true } } // Kitne messages hain group mein
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({ success: true, data: groups });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Group mein naya member add karna
  async addMember(req: AuthRequest, res: Response) {
    try {
      const { groupId, newUserId } = req.body;

      await prisma.conversation.update({
        where: { id: groupId },
        data: {
          participantIds: { push: newUserId }
        }
      });

      res.status(200).json({ success: true, message: "Member add ho gaya!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}