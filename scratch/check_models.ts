import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  // There is no listModels in the standard SDK easily, but we can try a simple generation to trigger discovery or just try a different model name.
  console.log("Key length:", (process.env.GEMINI_API_KEY || "").length);
}

listModels();
