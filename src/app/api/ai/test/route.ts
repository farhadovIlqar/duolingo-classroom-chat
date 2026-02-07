import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "edge"

export async function GET(req: Request) {
  const apiKey = process.env["GEMINI_API_KEY"]
  if (!apiKey) {
    return new Response("GEMINI_API_KEY not found", { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent("Hello, are you working?")
    return new Response(`Success: ${result.response.text()}`, { status: 200 })
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
