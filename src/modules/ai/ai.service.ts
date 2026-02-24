import { GoogleGenerativeAI } from "@google/generative-ai";

// .env mein GEMINI_API_KEY hona chahiye
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AIService {
  async getAIResponse(prompt: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Snapchat AI ki tarah thoda friendly context dete hain
      const fullPrompt = `You are "My AI" on Snapify, a friendly and helpful AI assistant. 
      Keep your responses concise and fun, just like Snapchat. 
      User says: ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error("AI response generate nahi ho paya.");
    }
  }
}