import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import friendRoutes from "../modules/friend/friend.routes";
import storyRoutes from "../modules/story/story.routes";
import reportRoutes from "../modules/report/report.routes";
import scoreRoutes from "../modules/score/score.routes";
import snapRoutes from "../modules/snap/snap.routes";
import chatRoutes from "../modules/chat/chat.routes";
import messageRoutes from "../modules/message/message.routes";
import reactionRoutes from "../modules/reaction/reaction.routes";
import blockRoutes from "../modules/block/block.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/friends", friendRoutes);
router.use("/stories", storyRoutes);
router.use("/reports", reportRoutes);
router.use("/score", scoreRoutes);
router.use("/snaps", snapRoutes);
router.use("/chats", chatRoutes);
router.use("/messages", messageRoutes);
router.use("/reactions", reactionRoutes);
router.use("/block", blockRoutes);

export default router;