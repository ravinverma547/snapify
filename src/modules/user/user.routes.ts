import { Router } from "express";
import { getMe, updateProfile, searchUsers, getUserProfile } from "./user.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/me", protect, getMe);
router.put("/update", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserProfile);

export default router;