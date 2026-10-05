// "Install NutriPlan": Chrome/Edge/Android offer a prompt we can trigger;
// iOS needs Share → Add to Home Screen. Listeners start at module load so an
// early beforeinstallprompt is never missed.

import { useSyncExternalStore } from 'react';

const listeners = new Set();
let deferred = null;
let installed = false;
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

const standalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
const ios = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let snapshot = { state: 'unknown' };
function compute() {
  const state = installed || standalone() ? 'installed' : deferred ? 'prompt' : ios() ? 'ios' : 'other';
  if (state !== snapshot.state) snapshot = { state };
  return snapshot;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const SERVER = { state: 'unknown' };

export const useInstallState = () => useSyncExternalStore(subscribe, compute, () => SERVER).state;

export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  event.prompt();
  const choice = await event.userChoice.catch(() => null);
  if (choice?.outcome === 'accepted') installed = true;
  notify();
  return choice?.outcome === 'accepted';
}
