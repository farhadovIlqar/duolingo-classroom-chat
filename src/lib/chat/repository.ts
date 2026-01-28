import "server-only";

import { dbAll, dbRun } from "@/lib/db/sqlite";
import type {
  ClassroomId,
  CourseId,
  IsoDateTime,
  LanguageCode,
  MessageId,
  ModerationFlag,
  ModerationResult,
  Role,
  TextMessage,
  UserId,
} from "@/lib/chat/types";

type MessageRow = Readonly<{
  id: string;
  classroom_id: string;
  course_id: string;
  language: string;
  author_id: string;
  author_role: string;
  created_at: string;
  content_kind: string;
  content_text: string;
  moderation_verdict: string;
  moderation_flags: string;
  moderation_student_hint: string | null;
}>;

function nowIso(): IsoDateTime {
  return new Date().toISOString() as IsoDateTime;
}

function newMessageId(): MessageId {
  return crypto.randomUUID() as MessageId;
}

export async function listMessages(input: {
  classroomId: ClassroomId;
  limit?: number;
}): Promise<readonly TextMessage[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  const rows = await dbAll<MessageRow>(
    `
    SELECT *
    FROM messages
    WHERE classroom_id = ?
    ORDER BY created_at DESC
    LIMIT ?;
  `,
    [input.classroomId, limit],
  );

  return rows
    .map((r) => {
      const flags = JSON.parse(r.moderation_flags) as ModerationFlag[];
      return {
        id: r.id as MessageId,
        classroomId: r.classroom_id as ClassroomId,
        courseId: r.course_id as CourseId,
        language: r.language as LanguageCode,
        authorId: r.author_id as UserId,
        authorRole: r.author_role as Role,
        createdAt: r.created_at as IsoDateTime,
        content: { kind: "text", text: r.content_text },
        moderation: {
          verdict: r.moderation_verdict as ModerationResult["verdict"],
          flags,
          studentHint: r.moderation_student_hint ?? undefined,
        },
      } satisfies TextMessage;
    })
    .reverse();
}

export async function createTextMessage(input: {
  classroomId: ClassroomId;
  courseId: CourseId;
  language: LanguageCode;
  authorId: UserId;
  authorRole: Role;
  text: string;
  moderation: ModerationResult;
}): Promise<TextMessage> {
  const id = newMessageId();
  const createdAt = nowIso();

  await dbRun(
    `
    INSERT INTO messages (
      id,
      classroom_id,
      course_id,
      language,
      author_id,
      author_role,
      created_at,
      content_kind,
      content_text,
      moderation_verdict,
      moderation_flags,
      moderation_student_hint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
    [
      id,
      input.classroomId,
      input.courseId,
      input.language,
      input.authorId,
      input.authorRole,
      createdAt,
      "text",
      input.text,
      input.moderation.verdict,
      JSON.stringify(input.moderation.flags),
      input.moderation.studentHint ?? null,
    ],
  );

  return {
    id,
    classroomId: input.classroomId,
    courseId: input.courseId,
    language: input.language,
    authorId: input.authorId,
    authorRole: input.authorRole,
    createdAt,
    content: { kind: "text", text: input.text },
    moderation: input.moderation,
  } satisfies TextMessage;
}

export async function updateMessageModeration(input: {
  messageId: MessageId;
  moderation: ModerationResult;
}): Promise<void> {
  await dbRun(
    `
    UPDATE messages
    SET
      moderation_verdict = ?,
      moderation_flags = ?,
      moderation_student_hint = ?
    WHERE id = ?;
  `,
    [
      input.moderation.verdict,
      JSON.stringify(input.moderation.flags),
      input.moderation.studentHint ?? null,
      input.messageId,
    ],
  );
}

