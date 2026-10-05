// True a moment after the first render: from then on, cards that appear
// are the user's doing and animate in. Meals restored from storage right
// after hydration just appear (no parade of pop-ins on every visit).
let settled = false;

export const isSettled = () => settled;

if (typeof window !== 'undefined') {
  const done = () => {
    settled = true;
  };
  if (document.readyState === 'complete') setTimeout(done, 600);
  else window.addEventListener('load', () => setTimeout(done, 600), { once: true });
}
