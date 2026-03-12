import { Router } from "express";
import { StoryController } from "./story.controller";
import { protect } from "../../middlewares/auth.middleware";
import upload from "../../uploads/upload.middleware";

const router = Router();
const storyController = new StoryController();

router.use(protect);

router.post("/post", upload.single("file"), storyController.postStory); // Story dalne ke liye
router.get("/feed", storyController.getFeed);    // Sabki stories dekhne ke liye
router.post("/view/:storyId", storyController.viewStory); // View register karne ke liye
router.get("/:storyId/views", storyController.getStoryViews); // Views list dekhne ke liye

export default router;