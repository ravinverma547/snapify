import { Router } from "express";
import { AdminController } from "./admin.controller";
import { protect } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";

const router = Router();
const adminController = new AdminController();

// Sirf ADMIN hi in routes ko touch kar sakta hai
router.use(protect, authorizeRoles("ADMIN"));

router.get("/users", adminController.getAllUsers);
router.delete("/user/:userId", adminController.deleteUser);

export default router;