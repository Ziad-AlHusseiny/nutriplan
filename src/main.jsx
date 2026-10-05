import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import Root from './Root.jsx';
import { loadDictionary } from './i18n/index.js';
import { appPath, localeFromPath, setActiveLocale } from './i18n/state.js';
import { registerServiceWorker } from './lib/pwa.js';
import { pageLoaders, pageOf } from './routes.js';
import './index.css';

// The page's language comes from its address: /… is English, /ar/… Arabic.
// Every page is prerendered, so the app hydrates the HTML that's already
// painted. The page's chunk starts loading now (it's also preloaded in the
// head); hydration waits for it inside <Suspense> while the static HTML
// stays on screen. Never await it here: the chunk imports from this entry,
// and a top-level await on it would deadlock.
const locale = localeFromPath(location.pathname);
const path = appPath(location.pathname);
pageLoaders[pageOf(path)]().catch(() => {});
await loadDictionary(locale);
setActiveLocale(locale);

const container = document.getElementById('root');
const app = (
  <StrictMode>
    <Root />
  </StrictMode>
);
// Hydrate only HTML that was rendered for this exact page and language (the
// offline fallback and 404.html serve another page's HTML: render fresh).
const prerendered = container.dataset.locale === locale && container.dataset.path === (path.replace(/\/+$/, '') || '/');
if (container.firstElementChild && prerendered) hydrateRoot(container, app);
else createRoot(container).render(app);

registerServiceWorker();

// Warm the other pages' chunks once the page has loaded and the browser is
// idle, so moving around is instant without competing with the first paint.
const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1));
const warm = () => setTimeout(() => idle(() => Object.values(pageLoaders).forEach((load) => load().catch(() => {}))), 1500);
if (document.readyState === 'complete') warm();
else window.addEventListener('load', warm, { once: true });
