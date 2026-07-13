# SupportSignal — Security Notes

## Scan result (2026-07-13 quality pass)

No committed secrets were found in tracked source:

- `.env` / credentials are gitignored
- only `.env.example` is tracked (placeholders, no real keys)
- local `apps/web/.env.local` and `.vercel/` must remain untracked
- demo seed is synthetic; emails are masked in UI previews

## Practices

1. Never commit `.env`, tokens, mailbox exports, or real customer CSVs.
2. Treat `/api/analyze/upload` as local/lab only; do not expose without auth.
3. High refund-risk outputs require human review — not automated customer actions.
4. If a secret is ever pushed, rotate it immediately and record incident details here **without** pasting the secret value.
