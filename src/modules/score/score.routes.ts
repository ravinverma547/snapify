import { Router } from "express";
import { ScoreController } from "./score.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const scoreController = new ScoreController();

router.use(protect);

router.get("/me", scoreController.getMyStats);
router.post("/update", scoreController.incrementScore);

export default router;