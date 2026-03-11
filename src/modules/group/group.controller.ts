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

      // Duplicate group check: Is there already a group with exactly these participants?
      const existingGroups = await prisma.conversation.findMany({
        where: { isGroup: true, participantIds: { hasEvery: uniqueParticipants } },
        include: { participants: { select: { id: true, username: true, avatarUrl: true } } }
      });
      const exactMatch = existingGroups.find(g => g.participantIds.length === uniqueParticipants.length);
      if (exactMatch) {
        return res.status(200).json({ success: true, data: exactMatch, message: "Group already exists" });
      }

      const group = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          participantIds: uniqueParticipants,
          adminIds: [myId!]
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

  // 4. Group se member nikalna
  async removeMember(req: AuthRequest, res: Response) {
    try {
      const { groupId, userIdToRemove } = req.body;
      const myId = req.user?.id;

      if (!groupId || !userIdToRemove) {
         return res.status(400).json({ success: false, message: "Group ID aur User ID chahiye" });
      }

      const group = await prisma.conversation.findUnique({ where: { id: groupId as string } });
      if (!group || !group.isGroup) {
        return res.status(404).json({ success: false, message: "Group nahi mila" });
      }

      if (!group.adminIds.includes(myId!)) {
        return res.status(403).json({ success: false, message: "Sirf Group Admin hi members nikal sakte hain" });
      }

      // Remove member
      const newParticipants = group.participantIds.filter(id => id !== userIdToRemove);
      
      await prisma.conversation.update({
        where: { id: groupId as string },
        data: { participantIds: newParticipants }
      });

      res.status(200).json({ success: true, message: "Member ko group se nikal diya gaya" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. Poora Group delete karna
  async deleteGroup(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const myId = req.user?.id;

      const group = await prisma.conversation.findUnique({ where: { id: groupId }});
      if (!group || !group.isGroup) {
         return res.status(404).json({ success: false, message: "Group nahi mila" });
      }

      if (!group.adminIds.includes(myId!)) {
         return res.status(403).json({ success: false, message: "Sirf Group Admin hi group delete kar sakte hain" });
      }

      // First delete all messages in this group
      const messages = await prisma.message.findMany({ where: { conversationId: groupId }});
      const messageIds = messages.map(m => m.id);

      // Delete reactions for these messages
      await prisma.reaction.deleteMany({
         where: { messageId: { in: messageIds } }
      });

      // Delete messages
      await prisma.message.deleteMany({
         where: { conversationId: groupId }
      });

      // Delete the conversation
      await prisma.conversation.delete({
         where: { id: groupId }
      });

      res.status(200).json({ success: true, message: "Group delete ho gaya" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. Group khud chhodna (Leave Group)
  async leaveGroup(req: AuthRequest, res: Response) {
    try {
      const { groupId } = req.body;
      const myId = req.user?.id;

      if (!groupId) return res.status(400).json({ success: false, message: "Group ID chahiye" });

      const group = await prisma.conversation.findUnique({ where: { id: groupId as string } });
      if (!group || !group.isGroup) return res.status(404).json({ success: false, message: "Group nahi mila" });

      if (!group.participantIds.includes(myId!)) {
        return res.status(403).json({ success: false, message: "Aap is group mein nahi hain" });
      }

      const newParticipants = group.participantIds.filter(id => id !== myId);
      let newAdmins = group.adminIds.filter(id => id !== myId);

      // Agar koi nahi bacha, toh group delete kardo
      if (newParticipants.length === 0) {
        const messages = await prisma.message.findMany({ where: { conversationId: groupId as string } });
        const messageIds = messages.map(m => m.id);
        await prisma.reaction.deleteMany({ where: { messageId: { in: messageIds } } });
        await prisma.message.deleteMany({ where: { conversationId: groupId as string } });
        await prisma.conversation.delete({ where: { id: groupId as string } });
        return res.status(200).json({ success: true, message: "Aap aakhiri thay, Group delete ho gaya" });
      }

      // Agar admin leave kiya, aur doosre log hain, toh kisi ek ko admin bana do
      if (newAdmins.length === 0 && newParticipants.length > 0) {
        newAdmins.push(newParticipants[0]);
      }

      await prisma.conversation.update({
        where: { id: groupId as string },
        data: { 
          participantIds: newParticipants,
          adminIds: newAdmins
        }
      });

      // System notification message
      const leavingUser = await prisma.user.findUnique({ where: { id: myId! }, select: { username: true, displayName: true } });
      const name = leavingUser?.displayName || leavingUser?.username || 'User';

      await prisma.message.create({
        data: {
          conversationId: groupId as string,
          senderId: myId!,
          isSystemMessage: true,
          content: `${name} has left the group.`
        }
      });

      res.status(200).json({ success: true, message: "Aapne group chhod diya" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}