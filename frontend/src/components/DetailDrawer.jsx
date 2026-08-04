import { useEffect, useRef } from "react";

import { categoryHex, sourceMeta } from "../lib/constants.js";
import { pluralize, severityHex, severityLabel } from "../lib/format.js";
import ScoreBreakdown from "./ScoreBreakdown.jsx";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Everything behind one incident: the score, the reasoning, the arithmetic, and every
 * original report that produced it.
 *
 * The evidence timeline at the bottom is the whole argument of this project — a
 * responder can always walk back from a flag to the raw words a caller said.
 */
export default function DetailDrawer({ incident, onClose, onLocate }) {
  const ringRef = useRef(null);

  // Close on Escape from anywhere — hands stay on the keyboard in a control room.
  useEffect(() => {
    if (!incident) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [incident, onClose]);

  // Re-run the ring fill whenever a different incident is shown.
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || !incident) return;
    const offset = RING_CIRCUMFERENCE * (1 - Math.min(incident.severity, 10) / 10);
    ring.style.strokeDashoffset = RING_CIRCUMFERENCE;
    void ring.getBoundingClientRect(); // force a reflow so the transition replays
    ring.style.strokeDashoffset = offset;
  }, [incident?.incident_id, incident?.severity]); // eslint-disable-line react-hooks/exhaustive-deps

  const sevColor = incident ? severityHex(incident.severity) : "var(--sev-low)";
  const catColor = incident ? categoryHex(incident.category) : "var(--muted)";

  return (
    <aside
      className={`drawer${incident ? " open" : ""}`}
      style={{ "--sevc": sevColor, "--catc": catColor }}
      aria-hidden={!incident}
      aria-label="Incident detail"
    >
      {incident && (
        <>
          <div className="drawer__hd">
            <div>
              <div className="drawer__id">{incident.incident_id}</div>
              <div className="drawer__cat">{incident.category}</div>
            </div>
            <button type="button" className="drawer__close" onClick={onClose} aria-label="Close detail">
              ×
            </button>
          </div>

          <div className="drawer__body">
            <div className="ringwrap">
              <div className="ringbox">
                <svg className="ring" viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="bg" cx="50" cy="50" r={RING_RADIUS} />
                  <circle
                    ref={ringRef}
                    className="fg"
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE}
                  />
                </svg>
                <div className="ringtxt">
                  <b style={{ color: sevColor }}>{incident.severity}</b>
                  <span>SEVERITY</span>
                </div>
              </div>
              <div className="ringside">
                <div className="level">{severityLabel(incident.severity)}</div>
                <div className="meta">
                  <b>{incident.confidence}</b> corroborating{" "}
                  {incident.confidence === 1 ? "report" : "reports"}
                  <br />
                  across <b>{incident.sources.length}</b>{" "}
                  {incident.sources.length === 1 ? "source type" : "source types"}
                </div>
              </div>
            </div>

            <div className="drawer__badges">
              {incident.escalating && (
                <span className="badge esc">
                  <span className="arr">↑</span>escalating
                </span>
              )}
              {incident.sources.length > 1 && <span className="badge verif">✓ multi-source</span>}
              {incident.sources.map((s) => (
                <span key={s} className="src-tag" style={{ "--st": sourceMeta(s).hex }}>
                  {s}
                </span>
              ))}
            </div>

            <div className="drawer__sum">{incident.summary}</div>

            <p className="drawer__h">Why it was flagged</p>
            <div className="why">
              {incident.reasons.map((reason) => (
                <div className="r" key={reason}>
                  <span className="k" aria-hidden="true">
                    ▸
                  </span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <p className="drawer__h">How the score was built</p>
            <ScoreBreakdown breakdown={incident.breakdown} />

            <p className="drawer__h">Source evidence · {pluralize(incident.confidence, "report")}</p>
            <div className="evid">
              {[...incident.reports]
                .sort((a, b) => a.t - b.t)
                .map((report) => {
                  const meta = sourceMeta(report.source);
                  return (
                    <div className="ev" key={report.id} style={{ "--sc": meta.hex }}>
                      <span className="ev__node" />
                      <div className="ev__meta">
                        <span aria-hidden="true">{meta.icon}</span> {meta.label}
                        <span className="t">T+{report.t}s</span>
                      </div>
                      <div className="ev__text">{report.text}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="drawer__act">
            <button type="button" className="btn" onClick={() => onLocate(incident.incident_id)}>
              📍 Locate on map
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
