import type {
  LanguageCode,
  ModerationFlag,
  ModerationResult,
  ModerationVerdict,
} from "@/lib/chat/types";

const PERSONAL_INFO_PATTERNS: readonly RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(\+?\d[\d\s().-]{7,}\d)\b/,
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBadWordsRegex(singleWords: readonly string[]): RegExp | null {
  if (singleWords.length === 0) return null;
  const escaped = singleWords.map(escapeRegex).join("|");
  return new RegExp(`\\b(${escaped})\\b`, "i");
}

function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

export function moderateText(input: {
  text: string;
  language: LanguageCode;
  badWords: readonly string[];
}): ModerationResult {
  const text = input.text;

  const flags: ModerationFlag[] = [];

  const singleWords = input.badWords.filter((w) => !w.includes(" "));
  const phrases = input.badWords.filter((w) => w.includes(" "));

  const bannedRe = buildBadWordsRegex(singleWords);
  if (bannedRe?.test(text)) flags.push("profanity");
  if (phrases.some((p) => containsPhrase(text, p))) flags.push("profanity");
  if (PERSONAL_INFO_PATTERNS.some((re) => re.test(text)))
    flags.push("personal_info");

  const verdict: ModerationVerdict = flags.length === 0 ? "allow" : "block";

  const studentHint =
    verdict === "allow"
      ? undefined
      : flags.includes("personal_info")
        ? "Please remove personal information and try again."
        : "Please use classroom-appropriate language and try again.";

  if (studentHint === undefined) return { verdict, flags };
  return { verdict, flags, studentHint };
}

