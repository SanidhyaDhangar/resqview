# Operational Disclaimer

**ResQView is decision-support software. It is not a dispatch system.**

## What ResQView does

It ingests crisis reports from multiple channels, classifies them, collapses duplicates
into single incidents, scores them for severity, and presents them ranked worst-first on
a map — with the reasoning and the original source reports attached to every incident.

## What ResQView does not do

- It does **not** dispatch responders, units, or resources.
- It does **not** make or approve operational decisions.
- It does **not** replace a trained emergency dispatcher, incident commander, or any
  established command-and-control procedure.

## Known limitations

Operators must understand these before relying on any output:

- **Rule-based extraction has finite recall.** The classifier matches keywords. Reports
  phrased outside its vocabulary may be mis-categorised or assigned a default category.
- **Clustering is geometric and greedy.** Reports are merged by proximity plus category.
  Two genuinely distinct incidents at the same address may be merged; one incident
  reported with imprecise coordinates may be split.
- **Corroboration is not verification.** Multiple reports raise confidence, but coordinated
  or cascading misinformation can corroborate a false incident. Multi-source agreement is
  evidence, not proof.
- **Severity scores are heuristic.** They encode the authors' assumptions about what is
  urgent. They are a triage aid, not a clinical or tactical assessment.
- **Live feeds can fail.** Network loss, upstream outages, and rate limits all degrade the
  picture. An empty map means "no data received", never "no incidents occurring".

## Required human oversight

Every incident surfaced by ResQView exposes its confidence score, its scoring rationale,
and links back to each original report. This is deliberate: a human must be able to audit
any output before acting on it. Deployments must keep a qualified human in the loop for
every operational decision.

## Data handling

The demonstration scenario uses synthetic reports. The live source uses a public,
already-published open-data feed. Any real deployment ingesting citizen reports takes on
responsibility for lawful, minimised, and secure handling of personal data — ResQView
surfaces only location, need, and urgency by design, but that design must be enforced at
the point of ingestion.
