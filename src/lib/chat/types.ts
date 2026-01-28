export type CourseId =
  | "spanish"
  | "french"
  | "japanese"
  | "german"
  | "italian"
  | "korean"
  | "chinese"
  | "portuguese"
  | "arabic"
  | "english";

export type Role = "student" | "teacher";

export type LanguageCode =
  | "en"
  | "es"
  | "fr"
  | "ja"
  | "de"
  | "it"
  | "ko"
  | "zh"
  | "pt"
  | "ar";

export type Branded<T, Brand extends string> = T & { readonly __brand: Brand };
export type MessageId = Branded<string, "MessageId">;
export type ClassroomId = Branded<string, "ClassroomId">;
export type UserId = Branded<string, "UserId">;

export type IsoDateTime = Branded<string, "IsoDateTime">;

export type ModerationFlag =
  | "profanity"
  | "harassment"
  | "sexual"
  | "self_harm"
  | "personal_info"
  | "spam";

export type ModerationVerdict = "allow" | "block" | "review";

export type ModerationResult = Readonly<{
  verdict: ModerationVerdict;
  flags: readonly ModerationFlag[];
  studentHint?: string;
}>;

export type MessageBase = Readonly<{
  id: MessageId;
  classroomId: ClassroomId;
  courseId: CourseId;
  language: LanguageCode;
  authorId: UserId;
  authorRole: Role;
  createdAt: IsoDateTime;
}>;

export type Message<TContent> = MessageBase &
  Readonly<{
    content: TContent;
    moderation: ModerationResult;
  }>;

export type TextMessageContent = Readonly<{
  kind: "text";
  text: string;
}>;

export type TextMessage = Message<TextMessageContent>;

export type NewTextMessageInput = Omit<
  TextMessage,
  "id" | "createdAt" | "moderation"
> & {
  content: TextMessageContent;
};

export type TeacherModerationUpdate = Readonly<{
  messageId: MessageId;
  verdict: ModerationVerdict;
  flags: readonly ModerationFlag[];
}>;

export function isCourseId(value: unknown): value is CourseId {
  return (
    typeof value === "string" &&
    [
      "spanish",
      "french",
      "japanese",
      "german",
      "italian",
      "korean",
      "chinese",
      "portuguese",
      "arabic",
      "english",
    ].includes(value)
  );
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return (
    typeof value === "string" &&
    ["en", "es", "fr", "ja", "de", "it", "ko", "zh", "pt", "ar"].includes(value)
  );
}

export function assertNever(x: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${String(x)}`);
}

