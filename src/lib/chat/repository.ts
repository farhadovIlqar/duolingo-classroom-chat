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

const INITIAL_BAD_WORDS: Readonly<Record<LanguageCode, readonly string[]>> = {
  en: ["fuck", "shit", "bitch"],
  es: ["mierda", "puta"],
  fr: ["merde", "putain"],
  ja: ["死ね"],
  de: ["scheiße"],
  it: ["merda"],
  ko: ["씨발"],
  zh: ["操你妈"],
  pt: ["merda"],
  ar: ["لعنة"],
};

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

export async function getMessageById(messageId: MessageId): Promise<TextMessage | null> {
  const rows = await dbAll<MessageRow>(
    `SELECT * FROM messages WHERE id = ?;`,
    [messageId],
  );
  const r = rows[0];
  if (!r) return null;
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
}

export async function listBadWords(language: LanguageCode): Promise<readonly string[]> {
  const existing = await dbAll<{ word: string }>(
    `SELECT word FROM bad_words WHERE language = ? ORDER BY word;`,
    [language],
  );
  if (existing.length > 0) return existing.map((r) => r.word);
  await seedBadWordsIfEmpty();
  const rows = await dbAll<{ word: string }>(
    `SELECT word FROM bad_words WHERE language = ? ORDER BY word;`,
    [language],
  );
  return rows.map((r) => r.word);
}

async function seedBadWordsIfEmpty(): Promise<void> {
  const count = await dbAll<{ n: number }>(
    `SELECT COUNT(*) as n FROM bad_words;`,
    [],
  );
  if (count[0].n > 0) return;
  const now = nowIso();
  for (const [lang, words] of Object.entries(INITIAL_BAD_WORDS)) {
    for (const word of words) {
      const id = crypto.randomUUID();
      await dbRun(
        `INSERT OR IGNORE INTO bad_words (id, word, language, created_at) VALUES (?, ?, ?, ?);`,
        [id, word, lang, now],
      );
    }
  }
}

export async function addBadWords(
  words: readonly string[],
  language: LanguageCode,
): Promise<void> {
  const now = nowIso();
  for (const word of words) {
    const trimmed = word.trim();
    if (!trimmed) continue;
    const id = crypto.randomUUID();
    await dbRun(
      `INSERT OR IGNORE INTO bad_words (id, word, language, created_at) VALUES (?, ?, ?, ?);`,
      [id, trimmed, language, now],
    );
  }
}

