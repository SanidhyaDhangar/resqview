# Phase 3 — Product Submission Copy

Paste-ready text for each field, written to describe **what was built**, not to re-pitch
the concept. Character counts are checked against the portal's caps in
`docs/check_lengths.py`.

---

## Disaster Scenario  *(cap 537)*

Mumbai monsoon flooding, first hour. The Mithi overtops; Hindmata, Sion and Kurla flood; the Andheri subway submerges; Chembur loses power. The 112 room, BMC, fire and NDRF are buried in reports arriving faster than anyone can read them — one rooftop rescue reported four times across three channels, while the child trapped on that roof sits under the duplicates.

ResQView was built and tested against exactly this: a 25-report, four-channel feed replayed in real time, collapsing to 12 ranked incidents, each linked to its evidence.

---

## Timeliness, Real-Time Responsiveness & Technical Reliability  *(cap 484)*

A FastAPI service re-triages the whole picture on every refresh, so the ranked map tracks the situation continuously rather than in batches; the client polls every 1.5 seconds.

Reliability is engineered, not asserted. A failed feed never blanks the map — the last good picture stays up behind an explicit warning, because "no incidents" and "nothing got through" must never look alike to a responder. 12 tests pin the ranking behaviour. Ships as one health-checked container.

---

## Comprehensiveness, Use of Available Data & Novel Data Discovery  *(cap 438)*

Four channels — 112 calls, social posts, SMS and IoT sensors — normalised into one stream. Feeds sit behind a single interface, so the scripted Mumbai scenario and a real, key-free feed of Seattle Fire/EMS 911 dispatches run through the identical engine: 108 live dispatches triaged to 94 incidents on demand.

The discovery is in the synthesis — sensors and citizen posts surface incidents ahead of official calls.

---

## Integration, Synthesis Quality & Responsible Data Handling  *(cap 411)*

Reports are geocoded, classified, then clustered by location and meaning: 25 raw reports collapse into 12 verified incidents.

Severity is auditable. Each exposes its arithmetic — category floor, urgency weight, corroboration weight — so a commander can recompute the score by hand. A published disclaimer states the limits, including that corroboration is not verification. Decision support, never dispatch.

---

## Usability, Clarity & Operational Readiness for Emergency Responders  *(cap 490)*

One screen: a worst-first priority queue beside a live map, readable in five seconds. Cards animate into new positions, so a re-rank is something you see rather than something you discover.

Any incident opens its full evidence trail — the reasoning, the score arithmetic, and every original report behind the flag. Category filters, keyboard dismissal, reduced-motion support, responsive to laptop screens. Runs from one container on a free tier.

---

## Remaining form fields

| Field | Answer |
|-------|--------|
| **Use of AI** | **AI was used.** It is permitted, and the repository history is explicit about it — claiming otherwise would be both false and easily checked. |
| **Product Video Type** | Whichever matches how you supply it — a hosted link (YouTube/Vimeo unlisted) is safer than five 50 MB uploads. |
| **Additional Documents** | Optional. The GitHub repository URL and the live deployment URL are the two worth adding. |
| **Rules acknowledgement** | Required — must be re-checked. |
| **Submit for Review** | Tick **only** once the video is attached and every field is filled. |
