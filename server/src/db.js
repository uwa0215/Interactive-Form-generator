import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

export const isPostgres = Boolean(DATABASE_URL);

let pgPool = null;
let sqliteDb = null;

function convertPlaceholders(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

async function getPgPool() {
  if (pgPool) return pgPool;
  const { Pool } = await import('pg');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  return pgPool;
}

async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  const { default: Database } = await import('better-sqlite3');
  const dataDir = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'formstudio.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  return sqliteDb;
}

let initPromise = null;

export function initDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (isPostgres) {
      const pool = await getPgPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS forms (
          id SERIAL PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          google_form_url TEXT NOT NULL,
          submit_url TEXT NOT NULL,
          total_pages INTEGER DEFAULT 1,
          schema_json TEXT NOT NULL,
          theme TEXT DEFAULT 'emerald',
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        );

        CREATE TABLE IF NOT EXISTS responses (
          id SERIAL PRIMARY KEY,
          form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
          participant_name TEXT DEFAULT '',
          participant_office TEXT DEFAULT '',
          answers_json TEXT NOT NULL,
          google_sync_status TEXT DEFAULT 'synced',
          submitted_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        );

        CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
        CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at);
      `);
    } else {
      const sdb = await getSqliteDb();
      sdb.exec(`
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
    }
  })();

  return initPromise;
}

const db = {
  async get(sql, params = []) {
    await initDb();
    if (isPostgres) {
      const pool = await getPgPool();
      const res = await pool.query(convertPlaceholders(sql), params);
      return res.rows[0] || undefined;
    }
    const sdb = await getSqliteDb();
    return sdb.prepare(sql).get(...params);
  },

  async all(sql, params = []) {
    await initDb();
    if (isPostgres) {
      const pool = await getPgPool();
      const res = await pool.query(convertPlaceholders(sql), params);
      return res.rows;
    }
    const sdb = await getSqliteDb();
    return sdb.prepare(sql).all(...params);
  },

  async run(sql, params = []) {
    await initDb();
    if (isPostgres) {
      const pool = await getPgPool();
      const isInsert = /^\s*INSERT\b/i.test(sql);
      const hasReturning = /\bRETURNING\b/i.test(sql);
      const pgSql = convertPlaceholders(
        isInsert && !hasReturning ? `${sql.trim().replace(/;$/, '')} RETURNING id` : sql
      );
      const res = await pool.query(pgSql, params);
      return {
        lastInsertRowid: res.rows?.[0]?.id ?? null,
        changes: res.rowCount ?? 0,
      };
    }
    const sdb = await getSqliteDb();
    const info = sdb.prepare(sql).run(...params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes,
    };
  },
};

export default db;
