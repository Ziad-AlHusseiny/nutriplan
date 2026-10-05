import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../../lib/format.js';

const ease = (x) => 1 - Math.pow(1 - x, 3); // ≈ ease-standard

/**
 * Counts between values over `duration` ms (DESIGN-SYSTEM duration-count)
 * by writing straight to the text node: no re-render per frame. Renders
 * the final value in the prerendered HTML; under reduced motion values swap
 * instantly (PRD §8.2), as they do with `instant`. `from` sets the
 * starting value of the first count.
 */
export default function AnimatedNumber({ value, duration = 700, format = (n) => formatNumber(Math.round(n)), from, run = true, instant = false, className = '', ...props }) {
  const ref = useRef(null);
  const shown = useRef(from ?? value);
  // The text node belongs to the effect after mount: React renders the
  // starting text once and never overwrites the animation.
  const [initial] = useState(() => format(from ?? value));
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !run) return undefined;
    const start = shown.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (instant || reduce || start === value || !Number.isFinite(start)) {
      shown.current = value;
      el.textContent = formatRef.current(value);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = start + (value - start) * ease(p);
      shown.current = v;
      el.textContent = formatRef.current(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, run, instant]);

  return (
    <span ref={ref} className={`tabular ${className}`} {...props}>
      {initial}
    </span>
  );
}
