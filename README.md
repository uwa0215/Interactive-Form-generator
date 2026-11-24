# Interactive Form Studio & Admin Monitor

Turn any public Google Form link into a modern, animated, mobile-first interactive form experience for participants — complete with a protected Admin Dashboard, QR code distribution, live Recharts analytics, conditional required comments for `"No"` answers, CSV export, and real-time Google Forms syncing.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, `qrcode.react`
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), JWT cookie auth

## Local Development

1. Copy `.env.example` to `.env` and set your admin credentials:
   ```bash
   cp .env.example .env
   ```
2. Install all dependencies:
   ```bash
   npm run install:all
   ```
3. Start both backend (`:4000`) and frontend (`:5173`):
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173/admin/login` (default credentials from `.env`: `admin@formstudio.local` / `admin123`).

## Deploying to Vercel

This repository includes `vercel.json` and `api/index.js` pre-configured for Vercel deployment:

1. Import this GitHub repository in [Vercel](https://vercel.com/new).
2. Add the following **Environment Variables** in Vercel Project Settings:
   - `ADMIN_EMAIL` (e.g. `admin@yourdomain.com`)
   - `ADMIN_PASSWORD` (choose a strong password)
   - `JWT_SECRET` (random secret string)
3. Deploy!

> **Note on Persistence**: On Vercel Serverless Functions, SQLite writes to `/tmp/formstudio.db`, which is ephemeral across cold starts. Every submission is still forwarded live to your Google Form (and Google Sheet). For permanent serverless database persistence on Vercel, swap `server/src/db.js` to Turso (libSQL), Neon, or Supabase Postgres.
