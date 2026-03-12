import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize AI Clients (Lazy initialization to prevent crashes if keys are missing)
let groq: any = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const getAIResponse = async (prompt: string) => {
  try {
    // 1. Try Groq (Sabse fast aur reliable filter)
    if (groq) {
      console.log(`⚡ Groq AI call for: "${prompt.substring(0, 40)}..."`);
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are 'My AI', a highly intelligent, friendly, and helpful Snapchat personal assistant. You have all the knowledge of a powerful AI like ChatGPT. You provide detailed, accurate, and helpful answers to any question while keeping a friendly, conversational Gen-Z vibe. Use emojis (✨, ⚡, 🔥, 💀), be relatable, and don't be afraid to give long, detailed explanations if the user asks for them. Keep it real, but always helpful. You are 'Snapify's' brain."
          },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        console.log(`✅ Groq Replied: [${responseText.trim()}]`);
        return responseText.trim();
      }
    }

    // 2. Fallback to Gemini if Groq fails or no key
    if (!genAI) throw new Error("No AI providers configured (Missing API Keys)");

    console.log("🔄 Falling back to Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Original Gemini context and safety settings (re-added for Gemini fallback)
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const contextPrompt = `You are "My AI", a friendly and helpful Snapchat companion on Snapify.
User says: "${prompt}"
Respond like a fun Gen-Z friend. Provide detailed and helpful answers. Use emojis. No formal talk. If they ask for a story, explanation, or help, give a full detailed response.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: contextPrompt }] }],
      safetySettings,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
    });


    const response = await result.response;
    const text = response.text();

    if (!text) {
      console.warn("⚠️ Gemini returned empty text. Possible safety block.");
      return "Bhai, main samajh nahi paaya. Phir se bolo? 🤔";
    }

    console.log(`✅ My AI Replied (Gemini Fallback): [${text.trim()}]`);
    return text.trim();

  } catch (error: any) {
    console.error("❌ AI Provider Error:", error.message || error);
    // FALLBACK: User ko aesa na lage ki AI tut gaya hai
    const mockReplies = [
      "Bhai, main thoda busy hoon, par tum sunao kya haal hai? 😊",
      "Snapchat pe maza aa raha hai? ✨",
      "Mast DP lagayi hai bhai! 🔥",
      "Main abhi thoda thak gaya hoon, par tumhare liye haazir hoon! 🙌",
      "Aur batao, aaj ka kya plan hai? 😎"
    ];
    return mockReplies[Math.floor(Math.random() * mockReplies.length)];
  }
};