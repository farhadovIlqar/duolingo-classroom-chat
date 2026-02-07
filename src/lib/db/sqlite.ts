import "server-only"

import path from "node:path"
import { promisify } from "node:util"
import sqlite3 from "sqlite3"

const DB_FILE = path.join(process.cwd(), "data", "chat.sqlite3")

type SqliteDatabase = sqlite3.Database

declare global {
  var __db: SqliteDatabase | undefined
}

function openDb(): SqliteDatabase {
  if (globalThis.__db) return globalThis.__db

  const db = new sqlite3.Database(DB_FILE)
  db.exec("PRAGMA foreign_keys = ON;")
  globalThis.__db = db
  return db
}

export async function ensureDbInitialized(): Promise<void> {
  const fs = await import("node:fs/promises")
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true })

  const db = openDb()
  const exec = promisify(db.exec.bind(db)) as (sql: string) => Promise<void>

  await exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      classroom_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      language TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      content_kind TEXT NOT NULL,
      content_text TEXT NOT NULL,
      moderation_verdict TEXT NOT NULL,
      moderation_flags TEXT NOT NULL,
      moderation_student_hint TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_classroom_created
      ON messages (classroom_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS bad_words (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(word, language)
    );

    CREATE INDEX IF NOT EXISTS idx_bad_words_language
      ON bad_words (language);

    CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
}

export async function dbAll<T>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<readonly T[]> {
  await ensureDbInitialized()
  const db = openDb()
  const all = promisify(db.all.bind(db)) as (
    sql2: string,
    params2: readonly unknown[],
  ) => Promise<T[]>
  return all(sql, params)
}

export async function dbRun(
  sql: string,
  params: readonly unknown[] = [],
): Promise<void> {
  await ensureDbInitialized()
  const db = openDb()
  const run = promisify(db.run.bind(db)) as (
    sql2: string,
    params2: readonly unknown[],
  ) => Promise<unknown>
  await run(sql, params)
}
