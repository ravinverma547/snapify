import { Router } from "express";
import { StreakController } from "./streak.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const streakController = new StreakController();

router.use(protect);

router.get("/my-streaks", streakController.getMyStreaks);

export default router;