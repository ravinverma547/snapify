import { Router } from "express";
import { GroupController } from "./group.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();
const groupController = new GroupController();

router.use(protect); // Bina login ke group ka access nahi

router.post("/create", groupController.createGroup);
router.get("/my-groups", groupController.getMyGroups);
router.patch("/add-member", groupController.addMember);
router.patch("/remove", groupController.removeMember);
router.patch("/leave", groupController.leaveGroup);
router.delete("/:groupId", groupController.deleteGroup);

export default router;