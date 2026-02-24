import { Router } from "express";
import { ReactionController } from "./reaction.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const reactionController = new ReactionController();

router.use(protect);

// POST: reaction toggle karne ke liye (Body mein messageId aur emoji jayega)
router.post("/toggle", reactionController.toggleReaction);

// GET: kisi message ke saare reactions dekhne ke liye
router.get("/:messageId", reactionController.getMessageReactions);

export default router;