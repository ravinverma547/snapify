import { Request, Response } from "express";
import { AIService } from "./ai.service";

const aiService = new AIService();

export class AIController {
  async chatWithAI(req: Request, res: Response) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ success: false, message: "Kuch toh pucho bhai!" });
      }

      const aiResponse = await aiService.getAIResponse(prompt);

      res.status(200).json({
        success: true,
        reply: aiResponse
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}