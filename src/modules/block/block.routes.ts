import { Router } from "express";
import { BlockController } from "./block.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const blockController = new BlockController();

router.use(protect);

router.post("/", blockController.blockUser);
router.get("/list", blockController.getBlockedUsers);
router.patch("/unblock/:unblockUserId", blockController.unblockUser);
router.delete("/:unblockUserId", blockController.unblockUser); // backward compat

export default router;