import { useSyncExternalStore } from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { activeLocale, LOCALES } from './i18n/state.js';
import { subscribeLocale } from './lib/locale.js';

/**
 * The client root. Remounts the router and app when the language changes,
 * so every string updates at once and links pick up the /ar base.
 */
export default function Root() {
  const locale = useSyncExternalStore(subscribeLocale, activeLocale, activeLocale);
  return (
    <BrowserRouter key={locale} basename={LOCALES[locale].base || undefined}>
      <App />
    </BrowserRouter>
  );
}
