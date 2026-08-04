import { sourceMeta } from "../lib/constants.js";
import { formatClock } from "../lib/format.js";

/**
 * Scenario progress, with a tick for every raw report.
 *
 * The ticks are the density of the incoming flood made visible: they cluster where the
 * control room got overwhelmed, which is exactly the moment this tool is arguing about.
 */
export default function MissionTimeline({ data }) {
  const duration = data?.scenario_duration || 1;
  const elapsed = Math.min(data?.elapsed ?? 0, duration);
  const pct = Math.min(100, (100 * elapsed) / duration);
  const isLive = data?.mode === "live";

  return (
    <div className="ov timeline">
      <span className="timeline__lab">{isLive ? "earliest" : formatClock(elapsed)}</span>
      <div className="track">
        <div className="track__fill" style={{ width: `${pct}%` }} />
        {(data?.raw_feed ?? []).map((report) => (
          <div
            key={report.id}
            className={`track__tick${report.t <= elapsed + 0.5 ? " hit" : ""}`}
            style={{
              left: `${(100 * report.t) / duration}%`,
              "--tc": sourceMeta(report.source).hex,
            }}
          />
        ))}
        <div className="track__head" style={{ left: `${pct}%` }} />
      </div>
      <span className="timeline__lab">{isLive ? "now" : formatClock(duration)}</span>
    </div>
  );
}
