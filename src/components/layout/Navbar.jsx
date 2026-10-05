import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { navLinks } from '../../data/navigation.js';
import { t } from '../../i18n/index.js';
import Button from '../ui/Button.jsx';
import Wordmark from '../ui/Wordmark.jsx';
import LanguageToggle from './LanguageToggle.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const linkClass = ({ isActive }) =>
  `relative inline-flex min-h-11 items-center px-3 font-medium transition-colors duration-(--duration-ui) hover:text-brand-ink after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors ${isActive ? 'text-brand-ink after:bg-brand' : 'text-ink after:bg-transparent'}`;

/**
 * Sticky navbar (PRD §2.1): logo, the five links (inline from 1024px; a
 * menu sheet below), the language and theme toggles, and "Start planning".
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const sheet = useRef(null);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Navigated (a link in the sheet): close it.
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!sheet.current?.contains(e.target) && !button.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/92 shadow-card backdrop-blur-md supports-[backdrop-filter]:bg-page/85" data-print="hide">
      <div className="page-x flex h-16 items-center gap-2">
        <Link to="/" className="me-auto rounded-full py-1 pe-2" aria-label="NutriPlan">
          <Wordmark />
        </Link>
        <nav aria-label={t('a11y.mainNav')} className="hidden lg:block">
          <ul className="flex items-center">
            {navLinks.map((link) => (
              <li key={link.id}>
                <NavLink to={link.to} end={link.end} className={linkClass}>
                  {t(`nav.${link.id}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden sm:block">
          <LanguageToggle />
        </div>
        <ThemeToggle />
        <div className="hidden md:block">
          <Button to="/planner">{t('nav.startPlanning')}</Button>
        </div>
        <button
          ref={button}
          type="button"
          className="-me-2 grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t('a11y.closeMenu') : t('a11y.openMenu')}
          onClick={() => setOpen((v) => !v)}
          data-testid="menu-button"
        >
          {open ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
        </button>
      </div>
      {open && (
        <div ref={sheet} id="mobile-menu" className="menu-sheet absolute inset-x-0 top-full rounded-b-xl border-b border-line bg-surface shadow-modal lg:hidden">
          <nav aria-label={t('a11y.mainNav')} className="page-x py-3">
            <ul>
              {navLinks.map((link, i) => (
                <li key={link.id} className="menu-item" style={{ '--i': i }}>
                  <NavLink to={link.to} end={link.end} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium transition-colors hover:bg-subtle ${isActive ? 'text-brand-ink' : 'text-ink'}`}>
                    <link.icon aria-hidden="true" size={20} className="text-muted" />
                    {t(`nav.${link.id}`)}
                  </NavLink>
                </li>
              ))}
              <li className="menu-item" style={{ '--i': navLinks.length }}>
                <NavLink to="/privacy" className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium transition-colors hover:bg-subtle ${isActive ? 'text-brand-ink' : 'text-ink'}`}>
                  <span aria-hidden="true" className="w-5" />
                  {t('nav.privacy')}
                </NavLink>
              </li>
            </ul>
            <div className="menu-item mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-4" style={{ '--i': navLinks.length + 1 }}>
              <Button to="/planner" className="grow sm:grow-0">
                {t('nav.startPlanning')}
              </Button>
              <div className="sm:hidden">
                <LanguageToggle onSwitch={() => setOpen(false)} />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
