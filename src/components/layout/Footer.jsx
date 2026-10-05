import { NavLink } from 'react-router-dom';
import { footerLinks, HELPLINE_URL, SOURCE_URL } from '../../data/navigation.js';
import { rich, t } from '../../i18n/index.js';
import DeveloperCredit from '../ui/DeveloperCredit.jsx';
import ExternalLink from '../ui/ExternalLink.jsx';
import Wordmark from '../ui/Wordmark.jsx';

/** Footer (PRD §2.2) plus the privacy and support lines (BUILD-LOG). */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface pb-[calc(72px+env(safe-area-inset-bottom))] md:mt-24 md:pb-0" data-print="hide">
      <div className="page-x grid gap-8 py-12 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-xl">
          <Wordmark />
          <p className="mt-4 text-muted">{t('footer.disclaimer')}</p>
          <p className="mt-3 text-sm text-muted">{t('footer.privacy')}</p>
          <p className="mt-3 text-sm text-muted">
            {rich('footer.support', {
              link: (
                <ExternalLink href={HELPLINE_URL} className="font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand-ink">
                  findahelpline.com
                </ExternalLink>
              ),
            })}
          </p>
        </div>
        <nav aria-label={t('a11y.footerNav')}>
          <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-2">
            {footerLinks.map((link) => (
              <li key={link.id}>
                <NavLink to={link.to} end={link.end} className="inline-flex min-h-11 items-center text-muted transition-colors hover:text-brand-ink">
                  {t(`nav.${link.id}`)}
                </NavLink>
              </li>
            ))}
            <li>
              <ExternalLink href={SOURCE_URL} className="inline-flex min-h-11 items-center text-muted transition-colors hover:text-brand-ink">
                {t('footer.source')}
              </ExternalLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="page-x flex flex-col gap-5 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{t('footer.copyright')}</p>
        <DeveloperCredit />
      </div>
    </footer>
  );
}
