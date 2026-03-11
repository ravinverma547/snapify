import { Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ReportController {
  // 1. Submit Report
  async submitReport(req: AuthRequest, res: Response) {
    try {
      const { 
        reason, 
        description, 
        reportedUserId, 
        reportedSnapId, 
        reportedStoryId 
      } = req.body;
      
      const reporterId = req.user?.id;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Reason dena zaroori hai!" });
      }

      const report = await prisma.report.create({
        data: {
          reason,
          description,
          reporterId: reporterId!,
          reportedUserId: reportedUserId || null,
          reportedSnapId: reportedSnapId || null,
          reportedStoryId: reportedStoryId || null,
        },
      });

      res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Get All Reports
  async getReports(req: AuthRequest, res: Response) {
    try {
      const reports = await prisma.report.findMany({
        include: {
          reporter: { select: { id: true, username: true } },
          reportedUser: { select: { id: true, username: true } },
          reportedSnap: true,
          reportedStory: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: reports });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Update Status (TypeScript Error Fixed & Existence Check Integrated)
  async updateReportStatus(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;
      const { status } = req.body;

      if (!reportId) {
        return res.status(400).json({ success: false, message: "ID missing hai" });
      }

      // 1. Pehle check karo ki kya ye report exist karti bhi hai?
      const existingReport = await prisma.report.findUnique({
        where: { id: reportId as string } 
      });

      if (!existingReport) {
        return res.status(404).json({ 
          success: false, 
          message: `Bhai, report ID (${reportId}) database mein nahi mili!` 
        });
      }

      // 2. Agar mil gayi, toh update karo
      const updatedReport = await prisma.report.update({
        where: { id: reportId as string },
        data: { status: status as any },
      });

      res.status(200).json({ success: true, data: updatedReport });
    } catch (error: any) {
      console.error("Update Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
} 