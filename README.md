# ResQView — A Live Common Operating Picture for Disaster Response

> **IEEE Response Quest™ Challenge** entry. A working system that turns the *flood* of
> crisis data — 112/911 calls, social posts, SMS, IoT sensors — into **one ranked, mapped,
> explainable view** a responder can read in five seconds.

When a disaster hits, the problem is rarely *too little* information — it is *too much, too
messy, too fast*. The same rooftop rescue arrives four times across three channels. A
structure fire and a routine power cut land in the same queue with nothing to say which
kills first. ResQView fuses those raw, duplicated, noisy reports into a **prioritised
incident picture that stays traceable to its evidence.**

```
   25 raw reports                    12 ranked incidents
  (112 · social · SMS · sensor)  →   deduplicated · scored · mapped · explained
```

---

## Quick start

**Deploy** — the API is stateless, so it drops onto Vercel as-is: `vercel.json` declares the
front end and the API as two services and routes `/api/*` to the latter. Or onto any
container host via the Dockerfile and `render.yaml`.

**Docker** — one command, no toolchain:

```bash
docker build -t resqview .
docker run -p 8000:8000 resqview
# open http://127.0.0.1:8000
```

**From source** — backend and frontend separately:

```bash
# terminal 1
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# terminal 2
cd frontend
npm ci
npm run dev        # http://127.0.0.1:5173, proxies /api to :8000
```

Requires Python 3.11+ and Node 20+. The map pulls OpenStreetMap/CARTO tiles from a public
CDN, so the browser needs internet access.

---

## Two data sources, one engine

The top-bar toggle switches the feed — and **nothing else changes**, because both sources
run through the identical triage engine and return the identical API contract.

| Mode | Feed |
|------|------|
| **Mumbai · Scripted** *(default)* | An authored monsoon-flood scenario, replayed over time. Repeatable and offline-capable — ideal for demonstrations. |
| **Seattle · Live** | **Real, near-real-time fire/EMS dispatches** from the [Seattle Real-Time Fire 911](https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj) open dataset, no API key. Fetched, normalised, classified, deduplicated and scored live. |

The live mode is the proof: swapping a simulated feed for a genuine one changes a config
value, not an architecture.

> **Why Seattle and not an Indian city?** India publishes no free, public, real-time feed
> of 112 call data. The only openly fetchable *incident-level* feeds today are US cities'
> 911 open-data portals, and Seattle's dispatch types map cleanly onto our category model.
> Real-time data that *does* cover India is hazard-level (USGS earthquakes, NASA fires,
> weather) rather than individual calls — straightforward to add as further sources.

---

## How the engine works

Four stages, all pure functions, all explainable.

1. **Classify** — each report gets a category (rescue / fire / medical / hazard / flood /
   infra / shelter) and urgency signals (*child, rising, trapped, worse…*). Structured
   feeds that already carry a dispatch type are trusted; free text is keyword-matched.
2. **Cluster** — nearby same-category reports (within ~180 m) collapse into one incident,
   so four reports of one rooftop rescue become **one** incident with higher confidence.
3. **Score** — severity is built as *headroom consumption*, not a product:

   ```
   severity = base + (10 − base) · boost
   boost    = 1 − exp(−(urgency_weight + corroboration_weight) / k)
   ```

   The **category sets a floor** — a power cut can never outrank a structure fire no matter
   how many people report it. **Evidence spends the headroom** above that floor, with
   genuine diminishing returns. `boost` is asymptotic to 1, so **severity approaches 10 but
   never reaches or clamps at it.**

   This matters more than it looks. The obvious formula (`base × urgency × corroboration`,
   clamped to 10) pins *every* life-threatening incident to a flat `10.0` — a rooftop
   rescue, a structure fire and a stranded patient all tie, and a worst-first queue quietly
   stops ranking exactly where ranking saves lives. Regression tests pin this behaviour.

4. **Explain** — every incident carries its reasoning, its score arithmetic, and every
   original report behind it.

**Human-in-the-loop by design.** ResQView is decision *support*, never autonomous dispatch.
Every flag exposes its confidence and its evidence. See [DISCLAIMER.md](DISCLAIMER.md) for
the limitations operators must understand before relying on it.

---

## The interface

A purpose-built Common Operating Picture, tuned for fast situational awareness:

- **Priority queue** — worst-first, re-sorting with FLIP animations so you *see* an
  incident move rather than finding it somewhere new.
- **Live map** — dark basemap, pins sized by severity and coloured by category; critical
  and escalating incidents pulse. The camera auto-frames the whole picture until you take
  control of it, then it is yours.
- **Incoming stream** — the raw multi-channel feed as it lands, so the collapse from 25
  reports to 12 incidents is something you watch happen rather than a claim.
- **Mission timeline** — scenario progress with a tick per report; the ticks cluster where
  a control room would have been overwhelmed.
- **Detail drawer** — severity ring, plain-language reasoning, **the score arithmetic
  itself**, and a timeline of every source report behind the incident.

Animated counters, category filters, new-critical toasts, `Esc` to close, keyboard focus
styles, and `prefers-reduced-motion` support throughout.

---

## Architecture

```
backend/app/sources/  ──►  backend/app/engine/  ──►  backend/app/routers/  ──►  frontend/
  scenario | seattle       classify → cluster        FastAPI, one contract      React COP
  (swappable feeds)        → score → explain         for every source           (Vite + Leaflet)
```

| Path | Role |
|------|------|
| `backend/app/engine/` | Triage engine. Pure functions, no I/O, fully tested. |
| `backend/app/sources/` | Feed adapters behind one `ReportSource` interface. |
| `backend/app/models/` | Pydantic contracts shared by engine and API. |
| `backend/app/routers/` | HTTP surface — deliberately thin. |
| `frontend/src/` | The Common Operating Picture. |
| `backend/data/reports.json` | The scripted Mumbai monsoon-flood scenario. |
| `docs/proposal/` | The written pitch submitted to the challenge. |

### API

| Endpoint | Returns |
|----------|---------|
| `GET /api/health` | Liveness probe. |
| `GET /api/incidents?mode=scenario\|live` | Ranked incidents, the raw feed, and the scenario clock. |

Interactive API docs at `/docs` when the server is running.

**The API holds no per-viewer state.** The client records when its replay began and passes
it as `since` (Unix seconds); the server turns that into a position in the feed. Omit
`since` to get the complete scenario, add `fresh=true` to bypass the live cache:

```bash
curl 'localhost:8000/api/incidents?mode=scenario'                    # whole picture
curl "localhost:8000/api/incidents?mode=scenario&since=$(date +%s)"  # replay from T+00:00
curl 'localhost:8000/api/incidents?mode=live&fresh=true'             # force a live re-pull
```

That is what lets it run on serverless platforms, where consecutive polls routinely land
on different instances. With the clock held in process memory, the mission time would jump
between requests and "restart the replay" would reset an instance the next poll never
reaches. Restarting is now purely client-side and costs no round trip at all.

### Adding a data source

Implement `ReportSource` in `backend/app/sources/`, return a `Snapshot` of `Report`s, and
register it in `registry.py`. Nothing downstream changes — that seam is the architecture's
whole point.

---

## Tests

```bash
cd backend && pytest
```

The engine is the part responders would stake decisions on, so its behaviour is pinned
against the real scenario data: deduplication, worst-first ordering, the category floor,
score-arithmetic reconciliation, determinism regardless of arrival order, and the
saturation regression described above.

---

## Free now, ready to scale

The system is deliberately **100% free and open-source** so an under-resourced agency can
deploy it today, with a clear funded growth path:

| Concern | Today (free) | Funded scale-up |
|---------|--------------|-----------------|
| Extraction | Rule-based keyword + urgency NLP | LLM extraction for higher recall on free text |
| Ingestion | Scripted replay + one live open-data feed | Live 112/911, social, SMS gateway, sensor streams (Kafka/Kinesis) |
| Backend | FastAPI on a single container | Horizontally scaled behind a queue |
| Map tiles | OpenStreetMap / CARTO | Self-hosted or commercial tiles, offline cache |

Because every layer sits behind the same explainable interface, the **decision-support
contract never changes** — only the engine behind it gets stronger.

---

## License

[MIT](LICENSE). Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

*ResQView — built for the IEEE Response Quest™ Challenge. Decision-support only; a human
responder always sees the evidence and makes the call.*
