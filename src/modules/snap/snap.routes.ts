import { Router } from "express";
import { SnapController } from "./snap.controller";
import upload from "../../uploads/upload.middleware"; 
import { protect } from "../../middlewares/auth.middleware"; 

const router = Router();
const snapController = new SnapController();

// 1. Snap bhejne ke liye
router.post(
  "/send", 
  protect, 
  upload.single("file"), 
  snapController.sendSnap
);

// 2. Apni snaps dekhne ke liye (GET request)
router.get("/my-snaps", protect, snapController.getMySnaps);

// 3. Snap open karne ke liye (PATCH request)
// Dhyaan rakhna URL mein :snapId dynamic parameter hai
router.patch("/open/:snapId", protect, snapController.openSnap);

export default router;