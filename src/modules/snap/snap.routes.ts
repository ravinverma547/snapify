import { Router } from "express";
import { SnapController } from "./snap.controller";
import { protect } from "../../middlewares/auth.middleware";
import upload from "../../middlewares/upload.middleware"; 

const router = Router();
const snapController = new SnapController();

router.use(protect);

// Frontend par form-data mein key ka naam 'file' rakhna
router.post("/send", upload.single("file"), snapController.sendSnap);
router.get("/inbox", snapController.getMySnaps);

export default router;