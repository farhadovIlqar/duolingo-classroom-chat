import type {
  LanguageCode,
  ModerationFlag,
  ModerationResult,
  ModerationVerdict,
} from "@/lib/chat/types";

const BANNED_PATTERNS: Record<LanguageCode, readonly RegExp[]> = {
  en: [/\b(fuck|shit|bitch)\b/i],
  es: [/\b(mierda|puta)\b/i],
  fr: [/\b(merde|putain)\b/i],
  ja: [/(死ね)/],
  de: [/\b(scheiße)\b/i],
  it: [/\b(merda)\b/i],
  ko: [/(씨발)/],
  zh: [/(操你妈)/],
  pt: [/\b(merda)\b/i],
  ar: [/(لعنة)/],
};

const PERSONAL_INFO_PATTERNS: readonly RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(\+?\d[\d\s().-]{7,}\d)\b/,
];

export function moderateText(input: {
  text: string;
  language: LanguageCode;
}): ModerationResult {
  const text = input.text;
  const language = input.language;

  const flags: ModerationFlag[] = [];

  const banned = BANNED_PATTERNS[language] ?? [];
  if (banned.some((re) => re.test(text))) flags.push("profanity");
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

