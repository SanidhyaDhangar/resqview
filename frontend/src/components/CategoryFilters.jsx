import { CATEGORIES, CATEGORY_KEYS } from "../lib/constants.js";

/**
 * Category toggles.
 *
 * Filtering is how a fire chief narrows a flooded map to their own problem, so the
 * off-state stays visible rather than disappearing — you must be able to see what you
 * have hidden from yourself.
 */
export default function CategoryFilters({ active, onToggle }) {
  return (
    <div className="filters">
      {CATEGORY_KEYS.map((c) => {
        const on = active.has(c);
        return (
          <button
            key={c}
            type="button"
            className={`chip ${on ? "on" : "off"}`}
            style={{ "--cc": CATEGORIES[c].hex }}
            aria-pressed={on}
            onClick={() => onToggle(c)}
          >
            <span className="cd" />
            {c}
          </button>
        );
      })}
    </div>
  );
}
