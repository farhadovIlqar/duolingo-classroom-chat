import { NextResponse } from "next/server";

import {
  CreateTextMessageSchema,
  getModerationForCreateInput,
} from "@/lib/chat/schemas";
import { createTextMessage, listMessages } from "@/lib/chat/repository";
import type { ClassroomId, UserId } from "@/lib/chat/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const classroomId = url.searchParams.get("classroomId") ?? "demo-classroom";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return NextResponse.json(
      { error: "Invalid limit" },
      { status: 400 },
    );
  }

  const messages = await listMessages(
    limit === undefined
      ? { classroomId: classroomId as ClassroomId }
      : { classroomId: classroomId as ClassroomId, limit },
  );

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateTextMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const moderation = getModerationForCreateInput(input);

  if (moderation.verdict !== "allow") {
    return NextResponse.json(
      {
        error: "Message blocked by classroom safety filter",
        moderation,
      },
      { status: 400 },
    );
  }

  const message = await createTextMessage({
    classroomId: input.classroomId as ClassroomId,
    courseId: input.courseId,
    language: input.language,
    authorId: input.authorId as UserId,
    authorRole: input.authorRole,
    text: input.content.text,
    moderation,
  });

  return NextResponse.json({ message }, { status: 201 });
}

