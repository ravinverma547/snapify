import { Router } from "express";
import { BlockController } from "./block.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const blockController = new BlockController();

router.use(protect); // Sabhi routes ke liye login zaroori hai

router.post("/", blockController.blockUser);
router.get("/list", blockController.getBlockedUsers);
router.delete("/:unblockUserId", blockController.unblockUser);

export default router;