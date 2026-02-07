import Link from "next/link"

export const dynamic = "force-dynamic"

async function getUsageStats() {
  try {

    const { dbAll } = await import("@/lib/db/sqlite")

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

    const inputTokens = result.total_input_tokens || 0
    const outputTokens = result.total_output_tokens || 0
    const totalRequests = result.total_requests || 0

    const cost =
      (inputTokens / 1_000_000) * 0.35 + (outputTokens / 1_000_000) * 0.7

    return {
      totalRequests,
      inputTokens,
      outputTokens,
      cost: cost.toFixed(6),
    }
  } catch (error) {
    console.error("Failed to fetch usage:", error)
    return {
      totalRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: "0.000000",
    }
  }
}

export default async function BillingPage() {
  const usage = await getUsageStats()

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Billing & Usage</h1>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-900 underline"
          >
            Back to Classroom
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">
              Total Requests
            </h3>
            <p className="text-3xl font-bold text-neutral-900">
              {usage.totalRequests}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">
              Tokens Processed
            </h3>
            <p className="text-3xl font-bold text-neutral-900">
              {(usage.inputTokens + usage.outputTokens).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              In: {usage.inputTokens.toLocaleString()} / Out:{" "}
              {usage.outputTokens.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">
              Estimated Cost
            </h3>
            <p className="text-3xl font-bold text-emerald-600">${usage.cost}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h3 className="font-medium text-neutral-900">Active Plan</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">AI Classroom Pro</h4>
                <p className="text-neutral-500 text-sm mt-1">
                  Unlimited usage of Gemini 1.5 Flash models for students.
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                Active
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <h4 className="font-medium text-sm mb-4">Payment Method</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-xs font-bold text-neutral-500">
                  VISA
                </div>
                <span className="text-sm text-neutral-700">•••• 4242</span>
                <span className="text-xs text-neutral-400 ml-auto">
                  Expires 12/28
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
