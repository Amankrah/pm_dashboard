# Nkabom PM Dashboard

Programme management dashboard for the Nkabom Collaborative faculty activity mapping.

## Contents

| Path | Description |
|------|-------------|
| `web/` | **Full app** — Phases 1–3: forms, analytics dashboard, email notifications |
| `Nkabom_Activity_Mapping_Form.html` | Original static form prototype |
| `Nkabom_Faculty_Activity_Map.html` | Original static dashboard prototype (ported to `web/`) |
| `Nkabom_Governance_Org_Chart.html` | Governance reference |

## Quick start

See **[web/README.md](web/README.md)** for setup and usage.

```bash
cd web
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Phases

- **Phase 1:** Database, allowlist login, PM link generation, public submit
- **Phase 2:** Full analytics dashboard from the HTML prototype
- **Phase 3:** Email notifications, dean reports, notification log
