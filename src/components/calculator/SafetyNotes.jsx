import { HeartHandshake, Stethoscope } from 'lucide-react';
import { HELPLINE_URL } from '../../data/navigation.js';
import { rich, t } from '../../i18n/index.js';
import ExternalLink from '../ui/ExternalLink.jsx';

/** Always visible next to the numbers (BUILD-LOG: safety and responsibility). */
export default function SafetyNotes() {
  return (
    <section aria-label={t('privacy.advice.title')} className="space-y-3 text-sm" data-testid="safety-notes">
      <p className="flex gap-3 rounded-xl bg-subtle p-4 text-ink">
        <Stethoscope aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-brand-ink" />
        <span>{t('calculator.safety.medical')}</span>
      </p>
      <p className="flex gap-3 rounded-xl bg-subtle p-4 text-ink">
        <HeartHandshake aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-brand-ink" />
        <span>
          {rich('calculator.safety.support', {
            link: (
              <ExternalLink href={HELPLINE_URL} className="font-semibold text-brand-ink underline underline-offset-4">
                findahelpline.com
              </ExternalLink>
            ),
          })}
        </span>
      </p>
      <p className="px-1 font-semibold text-muted">{t('calculator.safety.notAdvice')}</p>
    </section>
  );
}
