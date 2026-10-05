// Keeps keyboard focus somewhere sensible when the control that had it
// disappears (a removed meal, a cleared day): waits for the replacement to
// mount (cards animate out first), then focuses it.

export function focusSoon(find, { timeout = 1500, delay = 0 } = {}) {
  const start = performance.now() + delay;
  const tick = () => {
    if (performance.now() >= start) {
      const el = typeof find === 'string' ? document.querySelector(find) : find();
      if (el?.isConnected) {
        // Behind a closing dialog the page is still inert and focus() does
        // nothing: keep trying until it lands.
        el.focus({ preventScroll: false });
        if (document.activeElement === el) return;
      }
    }
    if (performance.now() - start < timeout) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** The first control in a planner slot: its card's title or edit button, or "+ Add meal". */
export const slotControl = (day, slot) => () => document.querySelector(`[data-testid="slot-${day}-${slot}"] [data-testid="planned-title"][href], [data-testid="slot-${day}-${slot}"] [data-testid="edit-meal"], [data-testid="slot-${day}-${slot}"] [data-testid="add-meal"]`);
