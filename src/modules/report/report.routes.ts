import { Router } from "express";
import { ReportController } from "./report.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const reportController = new ReportController();

router.use(protect);

// User report submit karne ke liye
router.post("/submit", reportController.submitReport);

// Admin ke liye routes
router.get("/all", reportController.getReports);
router.patch("/status/:reportId", reportController.updateReportStatus);

export default router;