import { z } from "zod";

import { moderateText } from "@/lib/chat/filter";
import type { ModerationResult } from "@/lib/chat/types";

export const CourseIdSchema = z.enum([
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
]);

export const LanguageCodeSchema = z.enum([
  "en",
  "es",
  "fr",
  "ja",
  "de",
  "it",
  "ko",
  "zh",
  "pt",
  "ar",
]);

export const RoleSchema = z.enum(["student", "teacher"]);

export const TextMessageContentSchema = z.object({
  kind: z.literal("text"),
  text: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(500, "Message is too long (max 500 characters)."),
});

export const CreateTextMessageSchema = z.object({
  classroomId: z.string().min(1),
  courseId: CourseIdSchema,
  language: LanguageCodeSchema,
  authorId: z.string().min(1),
  authorRole: RoleSchema,
  content: TextMessageContentSchema,
});

export type CreateTextMessageInput = z.infer<typeof CreateTextMessageSchema>;

export function getModerationForCreateInput(
  input: CreateTextMessageInput,
): ModerationResult {
  return moderateText({ text: input.content.text, language: input.language });
}

