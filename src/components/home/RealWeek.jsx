import { ArrowRight, CalendarDays, ChefHat, ShoppingBasket, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/index.js';

const ITEMS = [
  { id: 'plan', icon: CalendarDays, to: '/planner' },
  { id: 'shop', icon: ShoppingBasket, to: '/shopping' },
  { id: 'cook', icon: ChefHat, to: '/recipes' },
  { id: 'target', icon: Target, to: '/calculator' },
];

/** The four moments NutriPlan is built for (BUILD-LOG). */
export default function RealWeek() {
  return (
    <section className="page-x py-12 md:py-16" aria-labelledby="week-title">
      <h2 id="week-title" className="type-heading-md text-ink">
        {t('home.tools.title')}
      </h2>
      <p className="mt-2 max-w-2xl text-muted">{t('home.tools.sub')}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <li key={item.id} data-reveal style={{ '--i': i }} className="group relative flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-[transform,box-shadow] duration-(--duration-ui) has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand motion-safe:hover:-translate-y-1 hover:shadow-lift">
            <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent-ink">
              <item.icon aria-hidden="true" size={20} strokeWidth={2.25} />
            </span>
            <h3 className="mt-4 type-heading-sm text-ink">{t(`home.tools.items.${item.id}.title`)}</h3>
            <p className="mt-2 flex-1 text-muted">{t(`home.tools.items.${item.id}.body`)}</p>
            <Link to={item.to} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-ink outline-none after:absolute after:inset-0 after:content-['']">
              {t(`home.tools.items.${item.id}.cta`)}
              <ArrowRight aria-hidden="true" size={16} className="rtl:-scale-x-100" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
