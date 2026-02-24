import { Request, Response } from "express";
import { getAIResponse } from "../../config/ai";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const aiText = await getAIResponse(prompt);
    res.status(200).json({ success: true, response: aiText });
  } catch (error) {
    res.status(500).json({ success: false, message: "AI Offline" });
  }
};