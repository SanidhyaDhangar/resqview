/**
 * The API surface, in one place.
 *
 * Both feeds return the identical contract, so the client never branches on mode —
 * that is the whole point of the source abstraction on the backend.
 */

/** Thrown when the picture could not be refreshed. The UI degrades, it does not blank. */
export class ApiError extends Error {}

/**
 * Fetch the current picture.
 *
 * @param {string} mode - "scenario" | "live"
 * @param {object} options
 * @param {number} [options.since] - Unix seconds when this client started its replay.
 *   The server owns no clock, so this is what positions the scripted feed in time.
 * @param {boolean} [options.fresh] - Bypass the server's live cache.
 */
export async function fetchIncidents(mode, { since, fresh, signal } = {}) {
  const params = new URLSearchParams({ mode });
  if (since != null) params.set("since", String(since));
  if (fresh) params.set("fresh", "true");

  let response;
  try {
    response = await fetch(`/api/incidents?${params}`, { signal });
  } catch (cause) {
    throw new ApiError("Cannot reach the ResQView API", { cause });
  }

  if (!response.ok) {
    throw new ApiError(`API returned ${response.status}`);
  }
  return response.json();
}
