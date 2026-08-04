import { SEVERITY_BANDS } from "./constants.js";

/** Colour for a severity score — the single place the severity scale is interpreted. */
export function severityHex(severity) {
  return SEVERITY_BANDS.find((b) => severity >= b.min).hex;
}

/** Human label for a severity score ("Critical", "High", …). */
export function severityLabel(severity) {
  return SEVERITY_BANDS.find((b) => severity >= b.min).label;
}

/** Mission clock: seconds since feed start, rendered as T+MM:SS. */
export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `T+${mm}:${ss}`;
}

/** "4 reports" / "1 report" — small enough to inline, common enough to share. */
export function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
