import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";

function Tile({ value, label, accent, critical = false }) {
  const shown = useAnimatedNumber(value);
  return (
    <div className={`tile${critical ? " crit" : ""}`} style={{ "--accent": accent }}>
      <div className="tile__num mono">{shown}</div>
      <div className="tile__lbl">{label}</div>
    </div>
  );
}

/** The four numbers a commander reads first: volume in, incidents out, criticals, reach. */
export default function StatTiles({ rawReceived, incidentCount, criticalCount, sourceCount }) {
  return (
    <div className="stats">
      <Tile value={rawReceived} label="Reports In" accent="var(--brand)" />
      <Tile value={incidentCount} label="Incidents" accent="var(--c-flood)" />
      <Tile value={criticalCount} label="Critical" accent="var(--sev-crit)" critical />
      <Tile value={sourceCount} label="Sources" accent="var(--c-shelter)" />
    </div>
  );
}
