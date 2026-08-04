import { categoryHex, sourceMeta } from "../lib/constants.js";
import { pluralize, severityHex } from "../lib/format.js";

/**
 * One incident in the priority queue.
 *
 * Everything a commander needs to skip or select in under a second: score, category,
 * whether independent channels agree, whether it is getting worse, and how much
 * evidence sits behind it.
 */
export default function IncidentCard({ incident, selected, onSelect, cardRef }) {
  const sevColor = severityHex(incident.severity);

  return (
    <button
      type="button"
      ref={cardRef}
      className={`card${selected ? " sel" : ""}`}
      style={{ "--sevc": sevColor, "--catc": categoryHex(incident.category) }}
      onClick={() => onSelect(incident.incident_id)}
      aria-pressed={selected}
    >
      <div className="card__top">
        <span className="sev">{incident.severity}</span>
        <span className="cat">{incident.category}</span>
        <span className="badges">
          {incident.escalating && (
            <span className="badge esc" title="Worsening language across reports">
              <span className="arr">↑</span>esc
            </span>
          )}
          {incident.sources.length > 1 && (
            <span className="badge verif" title="Confirmed by independent channels">
              ✓ multi
            </span>
          )}
        </span>
      </div>

      <div className="sbar">
        <i style={{ width: `${incident.severity * 10}%` }} />
      </div>

      <div className="card__txt">{incident.summary}</div>

      <div className="card__foot">
        {incident.sources.map((s) => (
          <span key={s} className="src-tag" style={{ "--st": sourceMeta(s).hex }}>
            {s}
          </span>
        ))}
        <span style={{ color: "var(--muted-2)" }}>{pluralize(incident.confidence, "report")}</span>
        <span className="id">{incident.incident_id}</span>
      </div>
    </button>
  );
}
