import { AnimatePresence, LazyMotion, m, MotionConfig, useIsPresent } from 'motion/react';
import { loadFeatures, SPRING, useMotionReady } from '../../lib/motion.js';
import RecipeCard from './RecipeCard.jsx';

function Cell({ recipe, layoutKey, priority }) {
  // Leaving cards fade out but must not take clicks meanwhile.
  const present = useIsPresent();
  return (
    <m.li
      layout
      layoutDependency={layoutKey}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
      transition={SPRING}
      inert={!present || undefined}
    >
      <RecipeCard recipe={recipe} priority={priority} />
    </m.li>
  );
}

/**
 * Responsive grid, 1/2/3-up (PRD §4.3). Cards reflow with layout animation
 * when the filters change, and only then (layoutDependency), so opening the
 * filter panel above never makes cards glide. Static under reduced motion.
 */
export default function RecipeGrid({ recipes, priorityCount = 0 }) {
  const layoutKey = recipes.map((r) => r.id).join();
  const motionReady = useMotionReady();
  if (!motionReady) {
    // Before Motion's features load: a plain grid (filters still work, instantly).
    return (
      <LazyMotion features={loadFeatures} strict>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="recipe-grid">
          {recipes.map((r, i) => (
            <li key={r.id}>
              <RecipeCard recipe={r} priority={i < priorityCount} />
            </li>
          ))}
        </ul>
      </LazyMotion>
    );
  }
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="recipe-grid">
          <AnimatePresence initial={false} mode="popLayout">
            {recipes.map((r, i) => (
              <Cell key={r.id} recipe={r} layoutKey={layoutKey} priority={i < priorityCount} />
            ))}
          </AnimatePresence>
        </ul>
      </MotionConfig>
    </LazyMotion>
  );
}
