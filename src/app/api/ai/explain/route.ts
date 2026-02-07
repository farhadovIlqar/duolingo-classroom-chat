import { NextResponse } from "next/server"
import { explainBadWord } from "@/lib/ai/gemini"

export async function POST(req: Request) {
  const { text, language } = await req.json()

  if (!text || !language) {
    return NextResponse.json(
      { error: "Missing text or language" },
      { status: 400 },
    )
  }

  try {
    const explanation = await explainBadWord(text, language)

    const { dbRun } = await import("@/lib/db/sqlite")
    const { v4: uuidv4 } = await import("uuid")

    const inputEstimate = (text.length + 200) / 4
    const outputEstimate = explanation.length / 4

    await dbRun(
      "INSERT INTO ai_usage (id, model, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        uuidv4(),
        "gemini-2.5-flash",
        Math.round(inputEstimate),
        Math.round(outputEstimate),
        new Date().toISOString(),
      ],
    )

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error("Error generating explanation:", error)
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    )
  }
}
