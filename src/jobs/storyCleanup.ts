import cron from "node-cron";
import prisma from "../config/prisma";

// Har ghante chalega ye job
export const storyCleanupJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("🧹 Running Story Cleanup Job...");
    try {
      const now = new Date();
      
      const deleted = await prisma.story.deleteMany({
        where: {
          expiresAt: { lt: now } // Jo expire ho chuki hain
        }
      });

      console.log(`✅ Deleted ${deleted.count} expired stories.`);
    } catch (error) {
      console.error("❌ Story Cleanup Error:", error);
    }
  });
};