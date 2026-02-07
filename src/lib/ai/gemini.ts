import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env["GEMINI_API_KEY"]

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey || "")

export async function explainBadWord(text: string, language: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = `You are a helpful teacher assistant in a classroom. A student wrote the following message which was blocked because it contains inappropriate language (profanity) or personal information: "${text}". The language of the context is "${language}".

  Please explain to the student why this message is not appropriate for a classroom setting. Be gentle, educational, and concise. Do not repeat the bad word if possible, or refer to it indirectly. Focus on psychological safety and respect.
  
  Explain in the same language as the context (${language}).`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function chatWithAI(
  message: string,
  history: { role: "user" | "model"; parts: string }[],
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    })),
  })

  const result = await chat.sendMessageStream(message)
  return result.stream
}
