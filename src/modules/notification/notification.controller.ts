import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class NotificationController {
  // 1. User ki saari notifications get karna
  async getMyNotifications(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User ID missing" });
      }

      const notifications = await prisma.notification.findMany({
        where: { receiverId: myId },
        include: {
          sender: { 
            select: { id: true, username: true, avatarUrl: true } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: notifications || [] });
    } catch (error: any) {
      console.error("[NotificationController.getMyNotifications] Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching notifications" });
    }
  }

  // 2. Kisi specific notification ko 'Read' mark karna
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      const { notificationId } = req.params;

      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!notificationId) {
        return res.status(400).json({ success: false, message: "Notification ID missing" });
      }

      await prisma.notification.update({
        where: { 
          id: notificationId as string,
          receiverId: myId // Ensure user only marks their own notification
        },
        data: { isRead: true }
      });

      res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error: any) {
      console.error("[NotificationController.markAsRead] Error:", error);
      res.status(500).json({ success: false, message: "Failed to update notification" });
    }
  }

  // 3. Saari notifications ko ek sath read mark karna
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;
      if (!myId) return res.status(401).json({ success: false, message: "Unauthorized" });

      await prisma.notification.updateMany({
        where: { receiverId: myId, isRead: false },
        data: { isRead: true }
      });

      res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("[NotificationController.markAllAsRead] Error:", error);
      res.status(500).json({ success: false, message: "Server error while updating all notifications" });
    }
  }
}