import { Languages } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { t } from '../../i18n/index.js';
import { LOCALES } from '../../i18n/state.js';
import { localeHref, otherLocale, switchLocale } from '../../lib/locale.js';

/**
 * Switches language and stays on the same page. A real link to the other
 * language's page (works without JS); with JS it switches in place.
 */
export default function LanguageToggle({ className = '', onSwitch }) {
  const { pathname, search } = useLocation();
  const next = otherLocale();
  return (
    <a
      href={localeHref(next, pathname) + (next === 'ar' ? search : search.replace(/^\?/, '&'))}
      hrefLang={next}
      lang={next}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onSwitch?.();
        switchLocale(next);
      }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold text-ink transition-colors duration-(--duration-ui) hover:bg-subtle ${className}`}
      aria-label={next === 'ar' ? t('lang.toggleLabel') : undefined}
      data-testid="language-toggle"
    >
      <Languages aria-hidden="true" size={18} strokeWidth={2} className="text-brand-ink" />
      <span className={next === 'ar' ? 'font-display' : ''}>{LOCALES[next].label}</span>
    </a>
  );
}
