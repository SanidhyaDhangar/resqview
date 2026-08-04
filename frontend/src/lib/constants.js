/**
 * Shared vocabulary between the engine's output and the UI's visual language.
 *
 * Categories and sources are keyed exactly as the API emits them, so adding a category
 * on the backend surfaces here by adding one entry — nothing else in the UI changes.
 */

export const CATEGORIES = {
  rescue: { hex: "#ffb547", label: "rescue" },
  fire: { hex: "#ff5c5c", label: "fire" },
  medical: { hex: "#ff6fb5", label: "medical" },
  hazard: { hex: "#ff8a3d", label: "hazard" },
  flood: { hex: "#4aa8ff", label: "flood" },
  infra: { hex: "#8b98ad", label: "infra" },
  shelter: { hex: "#46d39a", label: "shelter" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const SOURCES = {
  112: { hex: "#ff5c5c", icon: "📞", label: "112 Call" },
  911: { hex: "#ff5c5c", icon: "📞", label: "911 Call" },
  twitter: { hex: "#4aa8ff", icon: "🐦", label: "Social" },
  sms: { hex: "#46d39a", icon: "💬", label: "SMS" },
  sensor: { hex: "#b48cff", icon: "📡", label: "Sensor" },
};

export const FALLBACK_SOURCE = { hex: "#9aa6b5", icon: "•", label: "Report" };

export function categoryHex(category) {
  return CATEGORIES[category]?.hex ?? "#8b98ad";
}

export function sourceMeta(source) {
  return SOURCES[source] ?? { ...FALLBACK_SOURCE, label: source };
}

/** Severity bands. These thresholds are what "critical" means everywhere in the UI. */
export const SEVERITY_BANDS = [
  { min: 8, label: "Critical", hex: "#ff4d57" },
  { min: 6, label: "High", hex: "#ff8a3d" },
  { min: 4, label: "Moderate", hex: "#ffd166" },
  { min: 0, label: "Low", hex: "#56b3ff" },
];

export const CRITICAL_THRESHOLD = 8;

/** How often the client re-pulls the picture, in ms. */
export const POLL_INTERVAL_MS = 1500;

export const MODES = {
  scenario: { label: "Mumbai · Scripted", icon: "🌧️", actionLabel: "Replay" },
  live: { label: "Seattle · Live", icon: "🚒", actionLabel: "Refresh" },
};
