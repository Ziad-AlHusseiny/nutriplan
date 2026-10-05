import { useEffect, useState } from 'react';

/**
 * For "fills when it first enters the viewport" (PRD §5.5) on prerendered
 * HTML: the static page shows final values ('final'). If the element turns
 * out to be below the fold, it's quietly reset ('armed') and then plays
 * when scrolled into view ('play'). Already on screen: it simply stays
 * final (no flash). Under reduced motion: always final.
 */
export function useReveal(ref) {
  const [phase, setPhase] = useState('final');
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let first = true;
    let armed = false;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (first) {
          first = false;
          if (visible) {
            io.disconnect();
            return;
          }
          armed = true;
          setPhase('armed');
          return;
        }
        if (visible && armed) {
          // Next frame, so the reset values are painted before the transition.
          requestAnimationFrame(() => setPhase('play'));
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return phase;
}
