import { Router } from "express";
import { MessageController } from "./message.controller";
import { protect } from "../../middlewares/auth.middleware";
import upload from "../../uploads/upload.middleware";

const router = Router();
const messageController = new MessageController();

router.use(protect); // Bina login ke message nahi bhej sakte

router.post("/send", upload.single("file"), messageController.sendMessage);
router.delete("/unsend/:messageId", messageController.unsendMessage);
router.get("/:conversationId", messageController.getChatMessages);

export default router;