import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const notificationController = new NotificationController();

router.use(protect);

router.get("/", notificationController.getMyNotifications);
router.patch("/read/:notificationId", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;