import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class NotificationController {
  // 1. User ki saari notifications get karna
  async getMyNotifications(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      const notifications = await prisma.notification.findMany({
        where: { receiverId: myId },
        include: {
          sender: { 
            select: { id: true, username: true, avatarUrl: true } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Kisi specific notification ko 'Read' mark karna
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({ success: false, message: "ID missing hai" });
      }

      await prisma.notification.update({
        where: { id: notificationId as string },
        data: { isRead: true }
      });

      res.status(200).json({ success: true, message: "Notification read!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Saari notifications ko ek sath read mark karna (Clear all types)
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      await prisma.notification.updateMany({
        where: { receiverId: myId, isRead: false },
        data: { isRead: true }
      });

      res.status(200).json({ success: true, message: "Sab read ho gaya!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}