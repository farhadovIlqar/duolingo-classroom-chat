"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  CourseIdSchema,
  LanguageCodeSchema,
  RoleSchema,
} from "@/lib/chat/schemas"
import type { ModerationVerdict } from "@/lib/chat/types"
import type { TextMessage } from "@/lib/chat/types"
import Link from "next/link"

const ChatFormSchema = z.object({
  courseId: CourseIdSchema,
  language: LanguageCodeSchema,
  authorRole: RoleSchema,
  text: z.string().min(1, "Type a message.").max(500, "Max 500 characters."),
})

type ChatFormValues = z.infer<typeof ChatFormSchema>

type ApiError =
  | { error: string; moderation?: { studentHint?: string } }
  | { error: string; issues: unknown }

export function ChatClient() {
  const classroomId = "demo-classroom"
  const authorId = "demo-user"

  const [messages, setMessages] = useState<readonly TextMessage[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const defaults = useMemo<ChatFormValues>(
    () => ({
      courseId: "spanish",
      language: "en",
      authorRole: "student",
      text: "",
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChatFormValues>({
    resolver: zodResolver(ChatFormSchema),
    defaultValues: defaults,
  })
  const currentRole = watch("authorRole")

  const refresh = useCallback(async () => {
    const res = await fetch(
      `/api/messages?classroomId=${encodeURIComponent(classroomId)}`,
      {
        cache: "no-store",
      },
    )
    const data = (await res.json()) as { messages: TextMessage[] }
    setMessages(data.messages)
  }, [classroomId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classroomId,
          courseId: values.courseId,
          language: values.language,
          authorId,
          authorRole: values.authorRole,
          content: { kind: "text", text: values.text },
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as ApiError
        const hint =
          "moderation" in err && err.moderation?.studentHint
            ? ` ${err.moderation.studentHint}`
            : ""
        setFormError(`${err.error}.${hint}`)
        return
      }

      reset({ ...values, text: "" })
      await refresh()
    } finally {
      setSubmitting(false)
    }
  })

  async function setVerdict(messageId: string, verdict: ModerationVerdict) {
    await fetch(`/api/messages/${encodeURIComponent(messageId)}/moderation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        verdict,
        flags: verdict === "block" ? ["profanity"] : [],
      }),
    })
    await refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Duolingo Classroom Chat</h1>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-700">Course</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-3 py-2"
                {...register("courseId")}
              >
                {CourseIdSchema.options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-700">Language</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-3 py-2"
                {...register("language")}
              >
                {LanguageCodeSchema.options.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-700">Role</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-3 py-2"
                {...register("authorRole")}
              >
                {RoleSchema.options.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-700">Message</span>
            <textarea
              className="min-h-24 rounded-md border border-neutral-300 bg-white px-3 py-2"
              placeholder="Say something helpful for the class…"
              {...register("text")}
            />
            {errors.text?.message ? (
              <span className="text-sm text-red-600">
                {errors.text.message}
              </span>
            ) : null}
          </label>

          {formError ? (
            <div>
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
              <div>
                <div
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm cursor-pointer"
                  onClick={() => {
                    console.log("s")
                  }}
                >
                  {/* TODO: Bura AI button qoy */}TEST
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">Messages</h2>
          <span className="text-xs text-neutral-500">
            {messages.length} total
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">
                    {m.authorRole}
                  </span>{" "}
                  · {m.language} · {m.courseId}
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-900">
                {m.content.text}
              </p>

              {m.moderation.verdict !== "allow" ? (
                <div className="mt-2 text-xs">
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                    moderation: {m.moderation.verdict}
                  </span>
                </div>
              ) : null}

              {currentRole === "teacher" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs"
                    onClick={() => void setVerdict(m.id, "allow")}
                    type="button"
                  >
                    Mark allow
                  </button>
                  <button
                    className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs"
                    onClick={() => void setVerdict(m.id, "review")}
                    type="button"
                  >
                    Mark review
                  </button>
                  <button
                    className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs"
                    onClick={() => void setVerdict(m.id, "block")}
                    type="button"
                  >
                    Mark block
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {messages.length === 0 ? (
            <li className="py-8 text-center text-sm text-neutral-500">
              No messages yet. Send the first one.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
