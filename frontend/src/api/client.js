/**
 * The API surface, in one place.
 *
 * Both feeds return the identical contract, so the client never branches on mode —
 * that is the whole point of the source abstraction on the backend.
 */

/** Thrown when the picture could not be refreshed. The UI degrades, it does not blank. */
export class ApiError extends Error {}

export async function fetchIncidents(mode, { signal } = {}) {
  let response;
  try {
    response = await fetch(`/api/incidents?mode=${encodeURIComponent(mode)}`, { signal });
  } catch (cause) {
    throw new ApiError("Cannot reach the ResQView API", { cause });
  }

  if (!response.ok) {
    throw new ApiError(`API returned ${response.status}`);
  }
  return response.json();
}

/** Restart the scripted clock, or clear the live cache to force a fresh pull. */
export async function resetFeed(mode) {
  const response = await fetch(`/api/reset?mode=${encodeURIComponent(mode)}`, { method: "POST" });
  if (!response.ok) throw new ApiError(`Reset failed with ${response.status}`);
  return response.json();
}
