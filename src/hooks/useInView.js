import { useEffect, useState } from 'react';

/**
 * True once the element has entered the viewport (PRD §5.5: rings fill
 * "when the panel first enters the viewport").
 */
export function useInView(ref, { margin = '0px 0px -40px 0px' } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, seen]);
  return seen;
}
