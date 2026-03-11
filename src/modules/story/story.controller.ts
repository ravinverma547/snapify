import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class StoryController {
  // 1. Nayi Story post karna
  async postStory(req: AuthRequest, res: Response) {
    try {
      const { mediaType, privacy } = req.body;
      const authorId = req.user?.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "Story file upload nahi hui!" });
      }

      const url = file.path;

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

  // 2. Apne Friends aur apni active stories dekhna
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

      // Add my own ID to the list to see my own stories
      const allIds = [...friendIds, myId as string];

      // Sirf wo stories jo abhi tak expire nahi hui hain
      const stories = await prisma.story.findMany({
        where: {
          authorId: { in: allIds },
          expiresAt: { gt: new Date() },
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
          _count: { select: { views: true } },
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

      const story = await prisma.story.findUnique({ where: { id: storyId as string } });
      if (!story) return res.status(404).json({ success: false, message: "Story nahi mili" });

      // Don't count own view as a view (usually)
      if (story.authorId !== viewerId) {
        await prisma.storyView.upsert({
          where: {
            storyId_viewerId: {
              storyId: storyId as string,
              viewerId: viewerId!,
            },
          },
          update: {},
          create: {
            storyId: storyId as string,
            viewerId: viewerId!,
          },
        });
      }

      res.status(200).json({ success: true, message: "Story viewed" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. Story ke viewers ki list nikalna (Sirf author ke liye)
  async getStoryViews(req: AuthRequest, res: Response) {
    try {
      const { storyId } = req.params;
      const myId = req.user?.id;

      const story = await prisma.story.findUnique({
        where: { id: storyId as string },
        select: { authorId: true }
      });

      if (!story) return res.status(404).json({ success: false, message: "Story nahi mili" });
      if (story.authorId !== myId) return res.status(403).json({ success: false, message: "Sirf author hi viewers dekh sakta hai" });

      const views = await prisma.storyView.findMany({
        where: { storyId: storyId as string },
        include: {
          viewer: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
        },
        orderBy: { viewedAt: 'desc' }
      });

      res.status(200).json({ success: true, data: views });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}