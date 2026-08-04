# Demo Video — Script & Shot List

**Target: 3:30.** The cap is 2–5 minutes; 3:30 leaves room to breathe without padding.

## Hard requirements from IEEE

| Requirement | How we meet it |
|---|---|
| A **real person** interacting with the product | You are on camera, and your cursor drives every action. No screen recording narrated over a static UI. |
| **No simulated interaction** | Everything happens live in the browser. Do not fake a click or cut to a mockup. |
| **No AI-generated avatars, no stock footage** | Webcam only. |
| **Landscape, ≥720p** | Record 1920×1080. |
| **English audio, or accurate captions** | Speak English; still add captions — judging is in English and captions protect you against accent/audio issues. |
| **2–5 minutes** | Script runs ~3:30 at a calm pace. |

**Format:** screen recording at 1920×1080 with a webcam bubble in a corner. Open on your
face for the first ~10 seconds so it is unmistakable that a real person is present, then
shrink to the corner bubble for the rest.

---

## Before you record

1. `docker run -p 8000:8000 resqview` (or the deployed URL — prefer the deployed URL, it
   proves the thing is live).
2. Browser at 1920×1080, **zoom 100%**, no bookmarks bar, no extensions visible.
3. Hit **Replay** so the scenario starts at T+00:00 the moment you begin.
4. Confirm the **Seattle · Live** toggle actually returns data *before* you record — it is
   a live third-party feed and it can be slow.
5. Close Slack/mail. One notification popup ruins a take.
6. Do a 20-second audio test. Bad audio fails more submissions than bad content.

---

## Beat sheet

### 0:00 – 0:20 — Who and what *(on camera, full frame)*

> "I'm Sanidhya Dhangar, and this is ResQView. In the first hour of a disaster, the problem
> isn't too little information — it's too much. I'm going to show you a real system
> triaging a Mumbai flood, and then the same engine running on live 911 data."

**Shot:** webcam full frame. Then shrink to corner.

---

### 0:20 – 1:00 — The flood arrives *(screen, scenario replaying)*

Let the replay actually run. Do not talk over silence — point at things as they move.

> "Reports are landing now — 112 calls, social posts, SMS, and river-level sensors, all in
> one stream on the right. Twenty-five of them arrive over the first two minutes."

**Point at:** the Incoming Stream ticking, the mission timeline filling, the counters
climbing.

> "Watch the queue on the left. It isn't chronological — it re-ranks itself worst-first as
> evidence arrives."

**Point at:** cards animating into new positions.

---

### 1:00 – 1:40 — 25 becomes 12 *(the core claim)*

> "Twenty-five raw reports became twelve incidents. The Hindmata rooftop rescue was
> reported four separate times across three different channels — 112, SMS and social. It's
> one pin, not four."

**Do:** click **INC-001** in the queue. The drawer opens, the map flies to it.

> "And here's every one of those four reports, with the original wording, in the order they
> came in."

**Do:** scroll the drawer to the evidence timeline. Pause. Let them read it.

---

### 1:40 – 2:20 — Why you can trust the number *(the differentiator)*

> "It scored 9.6. Not because a model said so — here's the actual arithmetic."

**Do:** scroll to **How the score was built**.

> "The category sets a floor of 8. Urgency language — 'child', 'trapped', 'rising' — adds
> weight. Four reports across three independent channels add more. Together they consumed
> 79% of the headroom above that floor. 8 plus 1.6 is 9.6. A commander can recompute that
> by hand in ten seconds."

> "And notice the structure fire below it, at 9.5. A fire has a *higher* base than a
> rescue — but corroboration and a trapped child put this rescue above it. That's the
> ranking doing real work."

**Point at:** INC-003 at 9.5 in the queue.

> "Nothing here ever reaches 10. No set of reports is ever certain, and a tool that claims
> certainty is a tool people stop checking."

---

### 2:20 – 3:00 — Real data, same engine *(the proof)*

> "Everything so far was a scripted scenario. Here's the same engine on real data."

**Do:** click **Seattle · Live**.

> "That's the live Seattle Fire and EMS 911 feed — actual dispatches, public open data, no
> API key. It just pulled a hundred-odd real calls and triaged them."

**Point at:** the counters, the map recentring on Seattle.

> "Notice the scores cluster tighter here. Dispatch codes don't contain urgency language
> the way a panicked caller does — so most incidents sit at their category floor. The
> engine isn't inventing confidence it doesn't have. That's the behaviour you want."

*(This is a strength, not an apology. Say it as a strength.)*

---

### 3:00 – 3:30 — The line that matters *(back to camera)*

**Do:** return the webcam to full frame.

> "ResQView never dispatches anyone. It ranks, it maps, and it shows its work — every flag
> traces back to the words a caller actually said. A human decides.
>
> It's open source, MIT licensed, runs in one container on a free tier, and every scoring
> rule is in the repository. Built so an under-resourced agency could run it tomorrow.
> Thank you."

---

## Recording notes

- **One take per section**, then cut together. Do not attempt a single 3½-minute take.
- **Move the cursor deliberately.** Jerky hunting reads as unfamiliarity with your own tool.
- **Let silences run** while something is animating. Dead air over motion is fine; talking
  over your own demo is not.
- If the live feed fails on camera, **do not hide it** — the error banner is a designed
  behaviour. "The live feed just dropped, and this is exactly what a responder sees: the
  last good picture, clearly marked stale, instead of an empty map" is a *better* moment
  than a clean run.

## Captions

Auto-generate, then **fix them by hand**. Proper nouns will be mangled: ResQView, Hindmata,
Mithi, Kurla, Chembur, NDRF, Sanidhya Dhangar. Judging is in English — mangled captions on
your key terms cost you comprehension marks.

## Deliverable checklist

- [ ] 1920×1080, landscape, MP4
- [ ] 2:00–5:00 runtime
- [ ] Real person visible and interacting
- [ ] Captions attached and corrected
- [ ] Under 50 MB per file, or hosted with an unlisted link
- [ ] No copyrighted music
