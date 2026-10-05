import { NavLink } from 'react-router-dom';
import { tabLinks } from '../../data/navigation.js';
import { t } from '../../i18n/index.js';

/**
 * Phone tab bar (BUILD-LOG): the four tools one thumb-tap away, so the
 * shopping list is right there in the supermarket. Under 768px only.
 */
export default function MobileTabBar() {
  return (
    <nav aria-label={t('a11y.tabsNav')} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" data-print="hide">
      <ul className="grid grid-cols-4">
        {tabLinks.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.to}
              className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${isActive ? 'text-brand-ink' : 'text-muted hover:text-ink'}`}
              data-testid={`tab-${link.id}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-brand-soft' : ''}`}>
                    <link.icon aria-hidden="true" size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {t(`nav.${link.id}`)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
