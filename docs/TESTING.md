# SupportSignal — Testing

## API (`apps/api`)

```bash
cd apps/api
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
ruff check app tests
pytest -q
```

Coverage intent:
- health/demo/analyze/report/methodology happy paths;
- refund classification + risk threshold;
- SLA hour computation;
- CSV upload validation (empty / missing columns / valid refund row).

## Web (`apps/web`)

```bash
cd apps/web
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

Vitest covers the browser engine:
- refund category + high risk;
- SLA breach for slow high-urgency replies;
- open ticket without first response;
- aggregation → memo/actions/demo summary.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs API + Web jobs on push/PR.
