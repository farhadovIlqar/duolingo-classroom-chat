"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

type Message = {
  role: "user" | "model"
  content: string
}

const SCHEMA_QUESTIONS = [
  "Why is it important to use kind words?",
  "How can I express anger constructively?",
  "What are some polite alternatives to common swear words?",
  "Why do people use bad language?",
  "How does my language affect others?",
]

export function ChatInterface() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q")
  const initialLang = searchParams.get("lang")

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  useEffect(() => {
    if (!initialized.current && initialQuery) {
      initialized.current = true
      // Add a system-like message to show context
      setMessages([
        {
          role: "user",
          content: `Teacher, I need help understanding why my message "${initialQuery}" was blocked.`,
        },
      ])
      handleSend(initialQuery, true)
    }
  }, [initialQuery])

  const handleSend = async (content: string, isInitialExplanation = false) => {
    // If it's not the initial explanation, we add the user message to UI immediately
    // If it IS the initial explanation, we already added a context message above in useEffect
    if (!isInitialExplanation) {
      if (!content.trim()) return
      const userMessage: Message = { role: "user", content }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
    }

    setIsLoading(true)
    setStreamingContent("")

    try {
      let endpoint = "/api/ai/chat"
      // Filter out the system-like explanatory message for the actual API call if needed,
      // but for simplicity we'll just send the last few or all.
      // For initial explanation we use a specific endpoint.

      let body: any = {
        messages: [...messages, { role: "user", content: content }],
      }
      // IMPORTANT: For normal chat, we need to pass history.
      // If isInitialExplanation, we construct a specific body.

      if (!isInitialExplanation) {
        body = { messages: [...messages, { role: "user", content }] }
      }

      if (isInitialExplanation) {
        endpoint = "/api/ai/explain"
        const lang = searchParams.get("lang") || "en"
        body = { text: content, language: lang }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to send message")

      if (isInitialExplanation) {
        // Explanation endpoint returns JSON { explanation: string }
        const data = await response.json()

        // Simulate streaming for explanation to match chat experience
        const fullText = data.explanation
        let currentText = ""
        for (let i = 0; i < fullText.length; i++) {
          currentText += fullText[i]
          setStreamingContent(currentText)
          // Variable delay for realistic typing effect
          await new Promise((r) => setTimeout(r, Math.random() * 20 + 10))
        }

        setMessages((prev) => [...prev, { role: "model", content: fullText }])
        setStreamingContent("")
      } else {
        // Chat endpoint returns a stream
        const reader = response.body?.getReader()
        if (!reader) throw new Error("No reader")

        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = new TextDecoder().decode(value)
          accumulated += text

          // We initiate the streaming state update with the chunks as they come
          // But to make it smoother "letter-by-letter" we could buffer.
          // However, network chunks are often small enough to look like typing.
          // Let's just update directly for responsiveness, or implement a smooth buffer.
          setStreamingContent((prev) => prev + text)
        }

        setMessages((prev) => [
          ...prev,
          { role: "model", content: accumulated },
        ])
        setStreamingContent("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
      setStreamingContent("")
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-3xl mx-auto rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {initialQuery && messages.length === 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
          Asking about: <span className="font-medium">"{initialQuery}"</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap bg-neutral-100 text-neutral-800 border-l-2 border-blue-400">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse"></span>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg p-3">
              <span className="flex gap-1">
                <span
                  className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          {SCHEMA_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="p-2 text-xs text-left rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600 hover:text-neutral-900 hover:border-blue-300 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
