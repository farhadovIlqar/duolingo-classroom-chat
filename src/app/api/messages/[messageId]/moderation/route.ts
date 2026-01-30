import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addBadWords,
  getMessageById,
  updateMessageModeration,
} from "@/lib/chat/repository";
import type { MessageId, ModerationFlag } from "@/lib/chat/types";

const UpdateModerationSchema = z.object({
  verdict: z.enum(["allow", "block", "review"]),
  flags: z.array(
    z.enum([
      "profanity",
      "harassment",
      "sexual",
      "self_harm",
      "personal_info",
      "spam",
    ]),
  ),
  studentHint: z.string().optional(),
  wordsToBlock: z.array(z.string().min(1)).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const message = await getMessageById(messageId as MessageId);
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (parsed.data.verdict === "block") {
    const wordsToAdd =
      parsed.data.wordsToBlock && parsed.data.wordsToBlock.length > 0
        ? parsed.data.wordsToBlock
        : [message.content.text.trim()].filter(Boolean);
    if (wordsToAdd.length > 0) {
      await addBadWords(wordsToAdd, message.language);
    }
  }

  await updateMessageModeration({
    messageId: messageId as MessageId,
    moderation: {
      verdict: parsed.data.verdict,
      flags: parsed.data.flags as ModerationFlag[],
      studentHint: parsed.data.studentHint,
    },
  });

  return NextResponse.json({ ok: true });
}

