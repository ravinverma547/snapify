import { Router } from "express";
import { MessageController } from "./message.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const messageController = new MessageController();

router.use(protect); // Bina login ke message nahi bhej sakte

router.post("/send", messageController.sendMessage);
router.get("/:conversationId", messageController.getChatMessages);

export default router;