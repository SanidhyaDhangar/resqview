import { MODES } from "../lib/constants.js";
import { formatClock } from "../lib/format.js";

function ShieldMark() {
  return (
    <div className="brand__mark" title="ResQView">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" fill="#06241f" />
        <path
          d="M9 12l2.2 2.4L15.5 9"
          stroke="#2af0db"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12a9 9 0 109-9M3 12l4-4M3 12l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({ mode, onModeChange, data, onRestart }) {
  const isLive = mode === "live";
  const feedComplete = data?.feed_complete ?? false;

  return (
    <header className="topbar">
      <div className="brand">
        <ShieldMark />
        <div>
          <h1>ResQView</h1>
          <div className="brand__sub">Common Operating Picture</div>
        </div>
      </div>

      <div className="modesw" role="group" aria-label="Data source">
        {Object.entries(MODES).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            data-mode={key}
            className={mode === key ? "on" : ""}
            aria-pressed={mode === key}
            onClick={() => onModeChange(key)}
          >
            <span className="dot" />
            {meta.label}
          </button>
        ))}
      </div>

      <div className="scenario-chip">
        <span aria-hidden="true">{MODES[mode].icon}</span>
        <span>{data?.scenario ?? "Initializing…"}</span>
      </div>

      <div className="topbar__right">
        <div className="clock">
          {isLive ? (
            <>
              <b>● LIVE</b>
              <span>real 911 feed</span>
            </>
          ) : (
            <>
              <b>{formatClock(Math.min(data?.elapsed ?? 0, data?.scenario_duration ?? 0))}</b>
              <span>mission clock</span>
            </>
          )}
        </div>

        <div className={`feed-pill${feedComplete ? " done" : ""}`}>
          <span className="dot" />
          <span>{feedComplete ? "COMPLETE" : "LIVE"}</span>
        </div>

        <button
          type="button"
          className="btn"
          onClick={onRestart}
          title={isLive ? "Re-pull the latest dispatches" : "Replay the scenario from the start"}
        >
          <ReplayIcon />
          <span>{MODES[mode].actionLabel}</span>
        </button>
      </div>
    </header>
  );
}
