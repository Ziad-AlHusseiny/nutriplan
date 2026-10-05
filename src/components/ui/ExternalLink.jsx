import { t } from '../../i18n/index.js';

/** A link that opens in a new tab, and says so to screen readers. */
export default function ExternalLink({ href, children, className = '', ...props }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
      {children}
      <span className="sr-only"> {t('a11y.opensInNewTab')}</span>
    </a>
  );
}
