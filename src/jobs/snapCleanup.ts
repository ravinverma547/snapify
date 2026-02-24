import cron from "node-cron";
import prisma from "../config/prisma";

export const snapCleanupJob = () => {
  cron.schedule("*/30 * * * *", async () => { // Har 30 min mein chalega
    console.log("📸 Cleaning up opened snaps...");
    try {
      const now = new Date();
      
      const result = await prisma.snap.deleteMany({
        where: {
          status: "OPENED",
          expiresAt: { lt: now }
        }
      });
      
      console.log(`✅ Deleted ${result.count} viewed snaps.`);
    } catch (error) {
      console.error("❌ Snap Cleanup Error:", error);
    }
  });
};