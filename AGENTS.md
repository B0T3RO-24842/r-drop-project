# AGENTS.md

R-Drop: Colombian re-commerce marketplace (Spanish-language project). Monorepo with **no root package.json and no npm workspaces** — run commands inside `backend/` or `frontend/`.

## Layout
- `backend/` — Express + TypeScript API (CommonJS, entry `src/app.ts`). Currently only exposes `GET /api/health`.
- `frontend/` — Vite + React 19 (ESM). UI text, comments, and console messages are in Spanish; keep that convention.
- `database/schema.sql` — Supabase Postgres schema (tables + RLS). Applied manually in the Supabase SQL editor; there is no migration tool. The `Producto`/`Oferta` types in `backend/src/types/index.ts` **do not match** this schema (numeric FKs vs UUID/text columns) — trust the schema for DB work.

## Commands
Backend (port 3001):
- `npm run dev` — ts-node-dev with `--transpile-only --respawn`
- `npm run build` — `tsc` → `dist/`; `npm start` runs it

Frontend (port 5173):
- `npm run dev` — Vite
- `npm run build` — `tsc -b && vite build` (typecheck is part of build)
- `npm run lint` — ESLint flat config (`eslint.config.js`)

No tests and no CI exist in this repo.

## Environment
`.env` files are gitignored but present locally. Backend uses dotenv; frontend uses Vite `import.meta.env` (`src/types/environment.d.ts` declares the vars).
- backend `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend `src/config/supabase.ts:10` throws if missing), optional `PORT`, `FRONTEND_URL` (CORS origin; defaults to `http://localhost:5173`).
- frontend `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (defaults to `http://localhost:3001/api`).

The backend uses the Supabase **service_role** key (bypasses RLS — never put it in the frontend); the frontend uses the anon key and relies on the RLS policies in `database/schema.sql`.

## Gotchas
- `react-router-dom` is imported throughout `frontend/src` (Navbar, Footer, AuthContext, every page) but is **missing from `frontend/package.json`** — it only works today because it was manually installed into `node_modules`. A fresh `npm install` breaks the frontend build until it's added as a dependency.
- Frontend is mid-migration: `src/main.tsx` renders the default Vite `App.tsx` counter with **no Router and no AuthProvider**; the real pages in `src/pages/` exist but are not routed. Don't assume any route works.
- `src/config/axios.ts:14` reads the auth token from `localStorage.getItem('supabase.auth.token')`, a non-standard key Supabase does not write — verify before relying on auth headers.
- Backend `npm run clean` uses `rm -rf` (Unix-only).
