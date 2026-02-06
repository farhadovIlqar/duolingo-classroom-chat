# Duolingo Engineering Learning Journey & Educational Safety Insights

## Engineering Learning Journey

**What we built.** A classroom chat with content moderation: students send messages; inappropriate or personal-info content is blocked before it’s stored. Teachers can mark messages as allow, review, or block; “Mark block” adds that message’s text to the bad-word list so future similar content is blocked automatically.

**Tech choices.** Next.js App Router for API routes and UI, SQLite for messages and a dynamic bad-word list, Zod for validation. Moderation runs server-side so clients can’t bypass it.

**Challenges and takeaways.**
- **From static to dynamic blocklist:** Moving bad words from hardcoded regexes into the DB made the list updatable and language-scoped. We seed an initial list and grow it when teachers block content.
- **Single words vs phrases:** Supporting both (word-boundary regex for single words, substring match for phrases) lets us block exact phrases (e.g. full message text) when a teacher blocks a message.
- **Teacher flow:** One-click “Mark block” that adds the message text to the blocklist keeps the UI simple and puts control in teachers’ hands without extra forms.

---

## Educational Safety Insights

**Why moderation matters.** In a learning environment, chat must stay safe and appropriate. Automated filters reduce exposure to bad language and personal info (emails, phone numbers) while keeping the experience usable.

**Teacher-in-the-loop.** Predefined word lists can’t cover every case. Letting teachers block messages and automatically add that content to the blocklist closes the loop: new bad content gets blocked without requiring code or config changes. Teachers become part of the safety system.

**Language-aware lists.** Bad words are stored per language (`bad_words` table with `language`). The same word can be allowed in one language and blocked in another, which fits multilingual classrooms (e.g. Duolingo-style courses).

**Clear feedback.** Blocked messages return a short hint (e.g. “Use classroom-appropriate language” or “Remove personal information”) so students know why their message was rejected and can adjust.

**Data and privacy.** Messages and blocklist live in a local SQLite DB. No external moderation APIs are required, which keeps control and data within the classroom or institution.
