# AGENTS.md

R-Drop: Colombian re-commerce marketplace (Spanish-language project). Monorepo with **no root package.json and no npm workspaces** — run commands inside `backend/` or `frontend/`.

## Layout
- `backend/` — Express + TypeScript API (CommonJS, entry `src/app.ts`). Routers: `productos`, `catalogos`, `ofertas`, `transacciones`, `solicitudes-vendedor`. `authenticate` verifica tokens ES256 de Supabase vía JWKS (requiere `SUPABASE_ANON_KEY`). Fotos se suben a Supabase Storage (bucket público `fotos-productos`) con service_role vía `POST /api/productos/upload-foto` (body `{ base64, mime }`).
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
- backend `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend `src/config/supabase.ts:10` throws if missing), `SUPABASE_ANON_KEY` (necesaria para que el middleware de auth ES256 verifique vía JWKS), optional `PORT`, `NODE_ENV`, `FRONTEND_URL` (CORS origin; defaults to `http://localhost:5173`).
- frontend `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (defaults to `http://localhost:3001/api`; se fija al compilar el build).

The backend uses the Supabase **service_role** key (bypasses RLS — never put it in the frontend); the frontend uses the anon key and relies on the RLS policies in `database/schema.sql`.

## Deploy / Producción (Cloudflare Tunnel)
La app corre **solo en el computador local** y se publica vía Cloudflare Tunnel (sin hosting; actividad SENA). Dominio: `rdrop.com.co` / `www.rdrop.com.co`. Frontend y backend se sirven en local:
- **Backend** (puerto 3001): `cd backend && npm run start` (usa `dist/` compilado; `npm run build` antes si cambió código). Se configura con `NODE_ENV=production` y `FRONTEND_URL=https://rdrop.com.co`.
- **Frontend** (puerto 4173): `cd frontend && npm run preview -- --port 4173` (sirve `dist/`; `npm run build` antes si cambia `VITE_API_URL` o código). En producción `VITE_API_URL=https://api.rdrop.com.co/api`.
- El túnel de Cloudflare apunta: `www.rdrop.com.co` + `rdrop.com.co` → `http://localhost:4173` (frontend) y `api.rdrop.com.co` → `http://localhost:3001` (backend). El backend se expone por la ruta `/api`. **No abrir puertos ni IP pública** — el túnel es saliente.
- `preview.allowedHosts` en `frontend/vite.config.ts` incluye `rdrop.com.co` y `www.rdrop.com.co` (Vite bloquea por defecto hosts no permitidos en `preview`; si no se agregan, da error "Blocked request. This host is not allowed").
- Supabase Auth (panel web): Site URL y Redirect URLs deben usar `https://rdrop.com.co` para que login/registro/update-password funcionen desde el dominio.

## Gotchas
- Frontend routes live in `src/main.tsx` (`BrowserRouter` + `AuthProvider`). Actual routes: `/`, `/products`, `/login`, `/register`, `/forgot-password`, `/update-password`, `/dashboard`, `/dashboard/perfil`, `/dashboard/productos` (protected). `/dashboard/productos` is `MisProductos` (crear producto con subida de fotos).
- `src/config/axios.ts` interceptor de **request** usa `supabase.auth.getSession()` (storageKey `r-drop-auth`) para inyectar el token; el interceptor de **response** redirige a `/login` en 401. Ya NO depende de la clave no-estándar `supabase.auth.token`.
- Backend `npm run clean` uses `rm -rf` (Unix-only).
- Documentos de plan/guion/requerimientos de la actividad (`GUION-EXPOSICION.txt`, `PLAN-DESPLIEGUE-CLOUDFLARE.md`, `requerimientosparavideo.txt`) están en `.gitignore` y no se commitean al repo.
- `react-router-dom` SÍ está declarado en `frontend/package.json` (7.14.0).
