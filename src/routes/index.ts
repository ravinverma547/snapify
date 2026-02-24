import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import friendRoutes from "../modules/friend/friend.routes";
import storyRoutes from "../modules/story/story.routes";
import reportRoutes from "../modules/report/report.routes";
import scoreRoutes from "../modules/score/score.routes";
import snapRoutes from "../modules/snap/snap.routes";
// ... baaki imports
const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/friends", friendRoutes);
router.use("/stories", storyRoutes);
router.use("/reports", reportRoutes);
router.use("/score", scoreRoutes);
router.use("/snaps", snapRoutes); // Ab API banegi: /api/v1/snaps/send
export default router;