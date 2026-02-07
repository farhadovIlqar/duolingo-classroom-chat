import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

export const dynamic = "force-dynamic"

const apiKey = process.env["GEMINI_API_KEY"]

const genAI = new GoogleGenerativeAI(apiKey || "")

export async function POST(req: Request) {
  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return new Response("Missing messages", { status: 400 })
  }

  const { dbRun } = await import("@/lib/db/sqlite")
  const { v4: uuidv4 } = await import("uuid")

  const modelName = "gemini-2.5-flash"
  const model = genAI.getGenerativeModel({ model: modelName })

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  })

  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessageStream(lastMessage.content)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let accumulatedText = ""

      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          accumulatedText += text
          controller.enqueue(encoder.encode(text))
        }

        const response = await result.response
        const usage = response.usageMetadata

        let inputTokens = 0
        let outputTokens = 0

        if (usage) {
          inputTokens = usage.promptTokenCount
          outputTokens = usage.candidatesTokenCount
        } else {
          inputTokens =
            messages.reduce(
              (acc: number, m: any) => acc + (m.content?.length || 0),
              0,
            ) / 4
          outputTokens = accumulatedText.length / 4
        }

        await dbRun(
          "INSERT INTO ai_usage (id, model, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?)",
          [
            uuidv4(),
            modelName,
            Math.round(inputTokens),
            Math.round(outputTokens),
            new Date().toISOString(),
          ],
        )
      } catch (e) {
        console.error("Error in stream or db logging:", e)
        controller.error(e)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
