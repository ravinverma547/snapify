import { Router } from "express";
import { GroupController } from "./group.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const groupController = new GroupController();

router.use(protect); // Bina login ke group ka access nahi

router.post("/create", groupController.createGroup);
router.get("/my-groups", groupController.getMyGroups);
router.patch("/add-member", groupController.addMember);

export default router;