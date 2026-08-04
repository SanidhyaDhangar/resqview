import { CATEGORIES, CATEGORY_KEYS } from "../lib/constants.js";

export default function MapLegend() {
  return (
    <div className="ov maplegend">
      {CATEGORY_KEYS.map((c) => (
        <span className="li" key={c}>
          <span className="d" style={{ background: CATEGORIES[c].hex }} />
          {c}
        </span>
      ))}
    </div>
  );
}
