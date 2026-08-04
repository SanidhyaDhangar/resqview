import { useCallback, useEffect, useRef, useState } from "react";

import { fetchIncidents } from "../api/client.js";
import { CRITICAL_THRESHOLD, POLL_INTERVAL_MS } from "../lib/constants.js";

const nowSeconds = () => Date.now() / 1000;

/**
 * Keeps one live picture of the incident feed.
 *
 * Three behaviours here are deliberate operational choices rather than conveniences:
 *
 * 1. **This client owns the replay clock.** It records when the replay started and sends
 *    that timestamp with every poll, so the server holds no per-viewer state and any
 *    instance can answer any request. Restarting is therefore instant and local — a new
 *    start time, no round trip, nothing to get out of sync.
 * 2. **A failed poll never blanks the picture.** The last good snapshot stays on screen
 *    with an error banner beside it. An empty map must always mean "no reports", never
 *    "the network hiccuped" — a responder cannot tell those apart visually, so the UI
 *    must never put them in the same state.
 * 3. **New incidents are announced once.** Ids already seen are tracked so an incident
 *    that merely re-scores does not re-alert. Alert fatigue is a safety problem.
 *
 * @param {string} mode - "scenario" | "live"
 * @param {(incident: object) => void} onNewIncident - called once per newly-seen incident
 *   at or above the alert threshold.
 */
export function useIncidents(mode, onNewIncident) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // When this client's replay started. The server derives the mission clock from it.
  const sinceRef = useRef(nowSeconds());
  // Ids already surfaced, so re-scoring an incident does not re-alert.
  const seenIds = useRef(new Set());
  // Suppress alerts for the first painted frame: everything is "new" on arrival.
  const hasPainted = useRef(false);
  // Held in a ref so changing the handler does not restart polling.
  const notify = useRef(onNewIncident);
  notify.current = onNewIncident;

  const poll = useCallback(
    async (signal, { fresh = false } = {}) => {
      try {
        const snapshot = await fetchIncidents(mode, { since: sinceRef.current, fresh, signal });
        if (signal?.aborted) return;

        // The API soft-fails a broken live feed in-band so the UI can stay up.
        if (snapshot.error) {
          setError(snapshot.error);
          setIsLoading(false);
          return;
        }

        if (hasPainted.current) {
          for (const incident of snapshot.incidents) {
            if (!seenIds.current.has(incident.incident_id) && incident.severity >= CRITICAL_THRESHOLD) {
              notify.current?.(incident);
            }
          }
        }
        for (const incident of snapshot.incidents) seenIds.current.add(incident.incident_id);

        hasPainted.current = true;
        setData(snapshot);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (signal?.aborted || err.name === "AbortError") return;
        setError(err.message);
        setIsLoading(false); // keep the last good `data` on screen
      }
    },
    [mode],
  );

  // Reset per-mode memory, then poll on an interval until the mode changes or we unmount.
  useEffect(() => {
    sinceRef.current = nowSeconds();
    seenIds.current = new Set();
    hasPainted.current = false;
    setData(null);
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    poll(controller.signal);
    const timer = setInterval(() => poll(controller.signal), POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [poll]);

  /** Replay the scripted scenario from T+00:00, or force a fresh pull of the live feed. */
  const restart = useCallback(async () => {
    setIsLoading(true);
    sinceRef.current = nowSeconds();
    seenIds.current = new Set();
    hasPainted.current = false;
    await poll(undefined, { fresh: mode === "live" });
  }, [mode, poll]);

  return { data, error, isLoading, restart };
}
