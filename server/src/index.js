import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb, isPostgres } from './db.js';
import { seedDatabaseIfEmpty } from './seed.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = initDb().then(() => seedDatabaseIfEmpty());
  }
  return readyPromise;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'form-studio-server',
    database: isPostgres ? 'postgres' : 'sqlite',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL) {
  ensureReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Form Studio API running on http://localhost:${PORT} (${isPostgres ? 'Postgres' : 'SQLite'})`
        );
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

export default app;
