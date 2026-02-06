## Task
Classroom chat needs content moderation so students can’t post bad words or personal info. Teachers must be able to block messages and add new bad words on the fly.

## Description
- Bad words live in SQLite (`bad_words` table, per language). Filter loads them when moderating new messages.
- Single words use word-boundary matching; phrases (e.g. full message text) use substring matching.
- When a teacher clicks “Mark block” on a message, that message’s text is added to the bad-word list for its language. Future messages containing that text are blocked.

## Installation
```bash
npm install
```

## Usage
The app stores the SQLite DB in `data/chat.sqlite3`. Create the folder before first run (or the app will create it when it starts):


**Development (run without building):**
```bash
npm run dev
```

Then open http://localhost:3000 (or the port shown in the terminal). Pick course, language, and role (student/teacher). Students send messages; blocked content is rejected. Teachers can mark messages allow / review / block; “Mark block” adds the message text to the bad-word list.
