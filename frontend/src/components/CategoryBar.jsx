import { CATEGORIES, CATEGORY_KEYS } from "../lib/constants.js";

/** A one-glance breakdown of what kind of emergency this is, proportionally. */
export default function CategoryBar({ incidents }) {
  const counts = incidents.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1;
    return acc;
  }, {});
  const total = incidents.length || 1;

  return (
    <div className="catbar-wrap">
      <div className="catbar">
        {CATEGORY_KEYS.filter((c) => counts[c]).map((c) => (
          <i
            key={c}
            style={{ width: `${(100 * counts[c]) / total}%`, background: CATEGORIES[c].hex }}
            title={`${c}: ${counts[c]}`}
          />
        ))}
      </div>
    </div>
  );
}
