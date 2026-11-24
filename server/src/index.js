import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { seedDatabaseIfEmpty } from './seed.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

seedDatabaseIfEmpty();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'form-studio-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Form Studio API running on http://localhost:${PORT}`);
  });
}

export default app;
