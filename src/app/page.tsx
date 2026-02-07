import { ChatClient } from "@/app/_components/ChatClient"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Duolingo Classroom
          </h1>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/" className="text-neutral-900 border-b-2 border-black">
              Home
            </Link>
            <Link
              href="/chat"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              AI Assistant
            </Link>
            <Link
              href="/billing"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Billing
            </Link>
          </nav>
        </div>
      </header>
      <main className="py-8">
        <ChatClient />
      </main>
    </div>
  )
}
