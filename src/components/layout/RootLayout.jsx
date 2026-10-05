import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { t } from '../../i18n/index.js';
import Toaster from '../ui/Toaster.jsx';
import Footer from './Footer.jsx';
import MobileTabBar from './MobileTabBar.jsx';
import Navbar from './Navbar.jsx';

/** Marks <html data-hydrated="1"> once the page itself (inside Suspense) is interactive. */
function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '1';
  }, []);
  return null;
}

/**
 * Navbar + page + footer (TECHNICAL-PLAN §3). After a client-side
 * navigation it scrolls to the top and moves focus to the new page, so
 * keyboard and screen-reader users start at its heading.
 */
export default function RootLayout() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (type !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, type]);

  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-full bg-surface px-5 py-3 font-semibold text-ink shadow-lift focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
        {t('a11y.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
          <Outlet />
          <HydrationMark />
        </Suspense>
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster />
    </>
  );
}
