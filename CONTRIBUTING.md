# Contributing to ResQView

## Getting set up

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (Node 20+):

```bash
cd frontend
npm ci
npm run dev                    # :5173, proxies /api to :8000
```

Run both and open <http://127.0.0.1:5173>.

## Tests

```bash
cd backend && pytest
```

Every change to the triage engine needs a test. The engine is the part responders would
stake decisions on, so its behaviour is pinned by tests against the real scenario data.

## Project layout

| Path | Purpose |
|------|---------|
| `backend/app/engine/` | classify → cluster → score → triage. Pure functions, no I/O. |
| `backend/app/sources/` | Feed adapters. Add a feed by implementing `ReportSource`. |
| `backend/app/models/` | Pydantic contracts shared by API and engine. |
| `backend/app/routers/` | HTTP surface. Thin — logic belongs in the engine. |
| `frontend/src/` | React Common Operating Picture. |
| `data/reports.json` | The scripted Mumbai monsoon-flood scenario. |

## Adding a data source

Implement `ReportSource` in `backend/app/sources/`, returning a `Snapshot` of `Report`
objects, then register it in `sources/registry.py`. Nothing downstream changes — that
seam is the point of the architecture.

## Design rules

These are not style preferences; they are what makes the tool trustworthy.

1. **Every output must be explainable.** If the engine flags something, it must be able to
   say why, in a sentence a responder can read under pressure.
2. **Never hide the evidence.** Incidents always carry their source reports.
3. **No autonomous action.** ResQView ranks and presents. Humans decide. See
   [DISCLAIMER.md](DISCLAIMER.md).
4. **Degrade gracefully.** A failed feed shows an error and keeps serving what it has.
   It never blanks the map without saying so.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
Keep the subject under 72 characters and explain *why* in the body when it isn't obvious.
