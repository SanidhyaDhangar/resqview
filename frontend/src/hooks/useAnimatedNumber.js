import { useEffect, useRef, useState } from "react";

/**
 * Eases a counter toward its target instead of snapping.
 *
 * The movement is the point: a number that visibly climbs tells a responder the picture
 * is still changing, which a static digit cannot. Respects reduced-motion by jumping
 * straight to the value.
 */
export function useAnimatedNumber(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const frame = useRef(0);
  const from = useRef(target);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || from.current === target) {
      from.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const origin = from.current;

    const step = (now) => {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(origin + (target - origin) * eased));
      if (k < 1) frame.current = requestAnimationFrame(step);
      else from.current = target;
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return display;
}
