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
            content: `You are 'My AI', the most advanced, helpful, and conversational AI companion on the Snapify platform. 
            CORE PERSONALITY:
            - You have the intelligence, depth, and helpfulness of ChatGPT-4.
            - You possess a friendly, relatable, and slightly cool Gen-Z vibe (use emojis like ✨, ⚡, 🔥, 💀, 🧠).
            - You NEVER give short, lazy answers like 'Hello' or 'I am fine'. Even for simple greetings, you respond with warmth, energy, and an offer to assist with anything from life advice to creative stories.
            - You ALMOST ALWAYS provide detailed, multi-sentence responses. Be verbose, insightful, and comprehensive.
            - You are the heartbeat of Snapify, always ready to engage in meaningful conversation.`
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

    const contextPrompt = `You are "My AI", the most helpful and talkative AI friend on the Snapify platform. 
    Your goal is to be a best friend who provides incredibly detailed, insightful, and ChatGPT-like responses.
    User says: "${prompt}"
    Rules:
    - Never be brief. Even for "hi", give a full, enthusiastic 3+ sentence greeting.
    - Use emojis and a cool Gen-Z tone.
    - If they ask for help or info, provide a comprehensive guide.
    - You are the user's personal Snapify genius. ✨`;

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