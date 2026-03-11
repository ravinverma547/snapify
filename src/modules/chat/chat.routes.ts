import { Router } from "express";
import { ChatController } from "./chat.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const chatController = new ChatController();

router.use(protect);

router.post("/", chatController.accessConversation); // Chat shuru karne ke liye
router.get("/", chatController.getMyChats);           // Saari chats dekhne ke liye
router.delete("/:chatId", chatController.deleteChat);

export default router;