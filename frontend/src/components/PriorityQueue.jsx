import { useCallback, useLayoutEffect, useRef } from "react";

import IncidentCard from "./IncidentCard.jsx";

/**
 * The worst-first queue.
 *
 * Cards animate to their new position with FLIP rather than jumping. When the picture
 * re-ranks mid-incident, a commander needs to see *that* an incident moved and where it
 * went — a silent reorder loses the one piece of information the movement carries.
 *
 * FLIP works by measuring positions at the end of every commit and using them as the
 * "first" frame of the next one: invert the delta, then release it.
 */
export default function PriorityQueue({ incidents, selectedId, onSelect, isLoading, emptyState }) {
  const nodes = useRef(new Map());
  const previousRects = useRef(new Map());
  const hasPainted = useRef(false);

  const registerNode = useCallback(
    (id) => (el) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    },
    [],
  );

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map();

    nodes.current.forEach((el, id) => {
      const last = el.getBoundingClientRect();
      nextRects.set(id, last);
      if (reduceMotion) return;

      const first = previousRects.current.get(id);

      if (!first) {
        // A card that was not on screen last frame: entrance, and flash if it arrived
        // into an already-populated queue (i.e. it is genuinely new information).
        const cls = hasPainted.current ? "card--new" : "card--enter";
        el.classList.add(cls);
        el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
        return;
      }

      const dy = first.top - last.top;
      if (Math.abs(dy) > 1) {
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1)";
          el.style.transform = "";
        });
      }
    });

    previousRects.current = nextRects;
    if (incidents.length) hasPainted.current = true;
  }, [incidents]);

  // Keep the selected card reachable when the queue re-ranks underneath it.
  useLayoutEffect(() => {
    if (!selectedId) return;
    nodes.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="queue">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="skel" key={i} />
        ))}
      </div>
    );
  }

  if (!incidents.length) {
    return <div className="queue">{emptyState}</div>;
  }

  return (
    <div className="queue">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.incident_id}
          incident={incident}
          selected={incident.incident_id === selectedId}
          onSelect={onSelect}
          cardRef={registerNode(incident.incident_id)}
        />
      ))}
    </div>
  );
}
