import { storyCleanupJob } from "./jobs/storyCleanup";
import { snapCleanupJob } from "./jobs/snapCleanup";

// Server start ke logic ke sath:
storyCleanupJob();
snapCleanupJob();