import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Gemini AI Setup (Snapchat ke 'My AI' jaisa feature banane ke liye)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

export const getAIResponse = async (prompt: string) => {
  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Bhai, AI thoda thak gaya hai. Baad mein try karo!";
  }
};