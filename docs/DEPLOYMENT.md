# SupportSignal — Deployment

## Public lab (recommended)

Target: **Vercel** project for `apps/web` (frontend-first).

1. Root of deploy context: `apps/web`
2. Framework: Next.js (`vercel.json`)
3. No secrets required for the public demo
4. Seed served from `public/data/support_inbox_demo.json`

Commands (from `apps/web`):

```bash
npm ci
npm run build
vercel link --yes --project supportsignal-lab
vercel deploy --prod --yes
```

Expected production alias pattern: `https://supportsignal-lab-lake.vercel.app`

GitHub repository homepage should point to the Live Demo URL.

## Local dual mode

```bash
# from repo root
start.bat
# or manually: API :8000 + web :3000
```

Optional env (see `.env.example`):

- `NEXT_PUBLIC_API_URL` — only if UI calls FastAPI (lab default uses browser engine)
- `CORS_ORIGINS` — FastAPI CORS allowlist

## What is out of scope for deploy

- Production Gmail/Zendesk/WhatsApp connectors
- Auth / multi-tenant billing
- Autonomous customer replies
- Storing uploaded CSVs in cloud (local uploads directory is gitignored)
