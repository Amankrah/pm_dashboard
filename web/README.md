# Nkabom Activity Map — Web App

## Phase 1 — Data collection

- **SQLite** database for submissions, campaigns, and invite links
- **Email allowlist** dashboard login (shared `APP_PASSWORD`)
- **Tokenized public forms** at `/f/{token}`
- **PM tools**: campaigns, shareable links, JSON import

## Phase 3 — Notifications & dean reports

- **Email on submit** — notifies Academic Lead (and optional CC) when a form is saved; logs all attempts in SQLite
- **Respondent confirmation** — optional `NOTIFY_RESPONDENT=true`
- **Email invite links** — from Campaigns when invite has an email address
- **Dean reports** — “Generate AES Dean Report” (etc.) on By Faculty view; print/save as PDF
- **Settings** — `/dashboard/settings` — SMTP status, test email (admin), notification log

Configure SMTP in `.env` (see `.env.example`). Without SMTP, submissions still work; notifications are logged as `skipped`.

## Phase 2 — Analytics dashboard

Full port of `Nkabom_Faculty_Activity_Map.html`:

| Route | View |
|-------|------|
| `/dashboard` | Overview — stats, pillar progress, Chart.js charts, faculty tracker |
| `/dashboard/activities` | Filterable activity table + CSV export |
| `/dashboard/faculty` | Per-faculty breakdown |
| `/dashboard/pillars` | Per-pillar detail |
| `/dashboard/partners` | Partner institution engagement |
| `/dashboard/synergies` | Cross-pillar, multi-faculty partners, shared contacts, collaborations |
| `/dashboard/targets` | Pillar targets (saved to SQLite) |
| `/dashboard/compare` | Period A vs B comparison |
| `/dashboard/reports` | Printable HTML reports |
| `/dashboard/campaigns` | Form link management |
| `/dashboard/submissions` | Raw data + JSON import |

## Setup

```bash
cd web
cp .env.example .env
# Edit .env: ALLOWED_EMAILS, APP_PASSWORD, SESSION_SECRET

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

Default seed admin: `ebenezer.kwofie@mcgill.ca` (password = `APP_PASSWORD` in `.env`, default `nkabom-dev-password`).

## Workflow

1. Sign in as an **admin** allowlisted email.
2. Go to **Campaigns & links** → create a reporting period (if needed).
3. **Generate shareable link** for a faculty member → copy URL.
4. Faculty opens `/f/{token}`, completes the form, clicks **Submit to Nkabom database**.
5. View rows under **Submissions** (cross-pillar activities are tagged).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` (relative to project root) |
| `ALLOWED_EMAILS` | Comma-separated dashboard users |
| `SEED_ADMIN_EMAIL` | Admin role on `db:seed` |
| `APP_PASSWORD` | Shared login password |
| `SESSION_SECRET` | Cookie signing (min 16 chars) |
| `NEXT_PUBLIC_APP_URL` | Base URL for invite links |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed allowlist + sample submissions |
| `npm run build` | Production build |

## Project layout

- `prisma/schema.prisma` — data model
- `src/app/f/[token]` — public faculty form
- `src/app/dashboard` — protected PM area
- `src/app/api/public/*` — unauthenticated submit APIs
- Original HTML prototypes remain in the parent `pm_dashboard/` folder
