import { NextResponse } from "next/server"
import { dbAll } from "@/lib/db/sqlite"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await dbAll<{
      total_requests: number
      total_input_tokens: number
      total_output_tokens: number
    }>(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens
      FROM ai_usage
    `)

    const result = stats[0] || {
      total_requests: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
    }

    return NextResponse.json({
      totalRequests: result.total_requests,
      inputTokens: result.total_input_tokens || 0,
      outputTokens: result.total_output_tokens || 0,
    })
  } catch (error) {
    console.error("Error fetching billing stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing stats" },
      { status: 500 },
    )
  }
}
