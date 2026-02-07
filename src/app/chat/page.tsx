import { Suspense } from "react"
import { ChatInterface } from "./ChatInterface"
import Link from "next/link"

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span>AI Classroom Assistant</span>
          <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent border border-blue-200 rounded-full px-2 py-0.5">
            Gemini
          </span>
        </h1>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900 underline"
        >
          Back to Classroom
        </Link>
      </div>

      <Suspense
        fallback={<div className="text-center py-10">Loading chat...</div>}
      >
        <ChatInterface />
      </Suspense>
    </div>
  )
}
