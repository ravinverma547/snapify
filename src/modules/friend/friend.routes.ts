import { Router } from "express";
import { FriendController } from "./friend.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const friendController = new FriendController();

router.use(protect);

// Purane names: sendFriendRequest -> Naya: sendRequest
router.post("/send", friendController.sendRequest); 

// Purane names: acceptFriendRequest -> Naya: acceptRequest
router.patch("/accept/:requestId", friendController.acceptRequest); 

// Dost dekhne ke liye list route
router.get("/list", friendController.getFriendsList);

export default router;