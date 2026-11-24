import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.VERCEL
  ? '/tmp'
  : path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'formstudio.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    google_form_url TEXT NOT NULL,
    submit_url TEXT NOT NULL,
    total_pages INTEGER DEFAULT 1,
    schema_json TEXT NOT NULL,
    theme TEXT DEFAULT 'emerald',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    participant_name TEXT DEFAULT '',
    participant_office TEXT DEFAULT '',
    answers_json TEXT NOT NULL,
    google_sync_status TEXT DEFAULT 'synced',
    submitted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
  CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at);
`);

export default db;
