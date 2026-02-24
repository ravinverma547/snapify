import { Router } from "express";
import { AIController } from "./ai.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const aiController = new AIController();

// Route: POST /api/ai/chat
router.post("/chat", protect, aiController.chatWithAI);

export default router;