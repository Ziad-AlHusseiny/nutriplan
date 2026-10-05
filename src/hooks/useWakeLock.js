import { useEffect } from 'react';

export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Keeps the screen on while `active` (cook mode is open), and
 * takes the lock back if the page returns to the foreground still active.
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !wakeLockSupported()) return undefined;
    let sentinel = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
        else {
          sentinel = lock;
          lock.addEventListener('release', () => {
            if (sentinel === lock) sentinel = null;
          });
        }
      } catch {
        // Denied (battery saver, iframe): cook mode still works.
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
