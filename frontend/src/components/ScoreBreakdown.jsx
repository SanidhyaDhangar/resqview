/**
 * The arithmetic behind a severity score.
 *
 * This panel is the difference between a tool a commander uses and a tool a commander
 * is asked to trust. Every number the engine used is on screen, in the order it was
 * applied, so the score can be checked by hand in a few seconds rather than believed.
 */
export default function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;

  const { base, urgency_weight: urgency, corroboration_weight: corroboration, boost, signals, severity } = breakdown;

  const basePct = (base / 10) * 100;
  const liftPct = ((severity - base) / 10) * 100;
  const lift = Math.round((severity - base) * 10) / 10;

  return (
    <div className="calc">
      <div className="calc__row">
        <span className="lbl">category floor</span>
        <span className="val">{base}</span>
      </div>

      <div className="calc__row">
        <span className="lbl">
          urgency evidence
          {signals?.length ? ` · ${signals.join(", ")}` : ""}
        </span>
        <span className="val">{urgency > 0 ? `+${urgency}` : "—"}</span>
      </div>

      <div className="calc__row">
        <span className="lbl">corroboration evidence</span>
        <span className="val">{corroboration > 0 ? `+${corroboration}` : "—"}</span>
      </div>

      <div className="calc__bar" title={`${Math.round(boost * 100)}% of the headroom above base`}>
        <div className="base" style={{ width: `${basePct}%` }} />
        <div className="lift" style={{ left: `${basePct}%`, width: `${liftPct}%` }} />
      </div>

      <div className="calc__row">
        <span className="lbl">headroom consumed</span>
        <span className="val">{Math.round(boost * 100)}%</span>
      </div>

      <div className="calc__total">
        <span className="lbl">
          severity = {base} + {lift}
        </span>
        <span className="val">{severity}</span>
      </div>

      <p className="calc__note">
        Evidence lifts a score toward 10 but never reaches it — no report set is ever
        certain. The category floor is never crossed by corroboration alone.
      </p>
    </div>
  );
}
