import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class StoryController {
  // 1. Nayi Story post karna
  async postStory(req: AuthRequest, res: Response) {
    try {
      const { url, mediaType, privacy } = req.body;
      const authorId = req.user?.id;

      if (!url || !mediaType) {
        return res.status(400).json({ success: false, message: "URL aur MediaType zaroori hain!" });
      }

      // 24 hours expiry logic
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.story.create({
        data: {
          url,
          mediaType,
          privacy: privacy || "FRIENDS",
          expiresAt,
          authorId: authorId!,
        },
      });

      res.status(201).json({ success: true, data: story });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Apne Friends ki active stories dekhna
  async getFeed(req: AuthRequest, res: Response) {
    try {
      const myId = req.user?.id;

      // Pehle apne friends ki IDs nikalon
      const myFriends = await prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: myId }, { addresseeId: myId }],
          status: "ACCEPTED",
        },
      });

      const friendIds = myFriends.map((f) => 
        f.requesterId === myId ? f.addresseeId : f.requesterId
      );

      // Sirf wo stories jo abhi tak expire nahi hui hain
      const stories = await prisma.story.findMany({
        where: {
          authorId: { in: friendIds },
          expiresAt: { gt: new Date() }, // expiry date abhi ke time se badi honi chahiye
        },
        include: {
          author: { select: { username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: stories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Story par View count badhana
  async viewStory(req: AuthRequest, res: Response) {
    try {
      const { storyId } = req.params;
      const viewerId = req.user?.id;

      await prisma.storyView.upsert({
        where: {
          storyId_viewerId: {
            storyId: storyId as string,
            viewerId: viewerId!,
          },
        },
        update: {}, // Agar pehle dekh chuka hai toh kuch mat karo
        create: {
          storyId: storyId as string,
          viewerId: viewerId!,
        },
      });

      res.status(200).json({ success: true, message: "Story viewed" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}