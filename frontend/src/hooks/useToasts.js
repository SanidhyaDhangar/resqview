import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_LIFETIME_MS = 3400;
/** Never stack more than this — a wall of alerts is the problem, not the solution. */
const MAX_VISIBLE = 3;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Set());

  const push = useCallback((toast) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE));

    const timer = setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
      timers.current.delete(timer);
    }, TOAST_LIFETIME_MS);
    timers.current.add(timer);
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return { toasts, push, clear };
}
