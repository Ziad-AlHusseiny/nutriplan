import { CalendarDays, Search, Target } from 'lucide-react';
import { list, t } from '../../i18n/index.js';

const ICONS = [Search, CalendarDays, Target];

/** Three steps (PRD §3.2); cards rise in on scroll, 60ms apart. */
export default function HowItWorks() {
  const cards = list('home.how.cards');
  return (
    <section className="page-x py-12 md:py-16" aria-labelledby="how-title">
      <h2 id="how-title" className="type-heading-md text-ink">
        {t('home.how.title')}
      </h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-4 lg:gap-6">
        {cards.map((card, i) => {
          const Icon = ICONS[i];
          return (
            <li key={card.title} data-reveal style={{ '--i': i }} className="rounded-xl border border-line bg-surface p-4 shadow-card md:p-6">
              <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand-ink">
                <Icon aria-hidden="true" size={22} strokeWidth={2.25} />
              </span>
              <h3 className="mt-4 type-heading-sm text-ink">{card.title}</h3>
              <p className="mt-2 text-muted">{card.body}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
