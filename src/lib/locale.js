// Switching language in place: load the dictionary, remount the app in the
// new locale, and move the address bar to the same page in the other
// language (/recipes ↔ /ar/recipes), so a reload or a shared link lands in
// the same language on the same page.

import { loadDictionary, t } from '../i18n/index.js';
import { activeLocale, appPath, LOCALES, localizedPath, setActiveLocale } from '../i18n/state.js';
import { localeStore } from './stores.js';

const listeners = new Set();

export const subscribeLocale = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const otherLocale = () => (activeLocale() === 'ar' ? 'en' : 'ar');

/** The other language's address for an in-app path (what the toggle links to without JS). */
export function localeHref(locale, path) {
  const target = localizedPath(path, locale);
  return locale === 'en' ? `${target}?lang=en` : target;
}

export async function switchLocale(next) {
  if (!LOCALES[next] || next === activeLocale()) return;
  await loadDictionary(next);
  const path = appPath(location.pathname);
  setActiveLocale(next);
  localeStore.set(next);

  const root = document.documentElement;
  root.lang = next;
  root.dir = LOCALES[next].dir;
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', next === 'ar' ? '/manifest-ar.webmanifest' : '/manifest.webmanifest');
  history.replaceState(null, '', localizedPath(path, next) + location.search.replace(/[?&]lang=en\b/, '') + location.hash);
  document.title = t('meta.title');

  listeners.forEach((fn) => fn());
}
