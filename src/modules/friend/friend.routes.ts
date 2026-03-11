import { Router } from "express";
import { FriendController } from "./friend.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const friendController = new FriendController();

router.use(protect);

router.post("/send", friendController.sendRequest);
router.patch("/accept/:requestId", friendController.acceptRequest);
router.patch("/reject/:requestId", friendController.rejectRequest);
router.delete("/unfriend/:friendId", friendController.unfriendUser);
router.get("/list", friendController.getFriendsList);
router.get("/pending", friendController.getPendingRequests);
router.get("/status/:userId", friendController.getFriendshipStatus);

export default router;