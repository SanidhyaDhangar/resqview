import { useRef } from "react";

import { sourceMeta } from "../lib/constants.js";

const VISIBLE_ITEMS = 7;

/**
 * The raw multi-channel feed, newest first.
 *
 * This panel exists to make the deduplication legible: you watch four separate messages
 * about one rooftop stream past here, then look left and see a single incident. Without
 * it, the collapse from 25 reports to 12 incidents is a claim rather than something the
 * viewer watched happen.
 */
export default function IncomingStream({ feed }) {
  const seen = useRef(new Set());
  const visible = feed.slice(0, VISIBLE_ITEMS);

  return (
    <aside className="ov incoming">
      <div className="incoming__hd">
        Incoming Stream
        <span className="lv">
          <span className="dot" />
          LIVE
        </span>
      </div>
      <div className="incoming__list">
        {visible.map((report) => {
          const meta = sourceMeta(report.source);
          const isNew = !seen.current.has(report.id);
          seen.current.add(report.id);
          return (
            <div
              key={report.id}
              className={`fitem${isNew ? " fitem--new" : ""}`}
              style={{ "--sc": meta.hex }}
            >
              <div className="fitem__si" aria-hidden="true">
                {meta.icon}
              </div>
              <div className="fitem__body">
                <div className="fitem__text">{report.text}</div>
                <div className="fitem__meta">
                  <b>{meta.label}</b> · T+{report.t}s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
