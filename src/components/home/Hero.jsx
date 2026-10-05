import { HERO_SIZES } from '../../data/images.js';
import { t } from '../../i18n/index.js';
import Button from '../ui/Button.jsx';
import RecipeImage from '../ui/RecipeImage.jsx';

/**
 * Compact hero (PRD §3.1). The entrance is CSS (it runs from the static
 * HTML, before any script); the photo is the LCP image on wide screens:
 * eager, high priority, preloaded by the prerendered head.
 */
export default function Hero() {
  return (
    <section className="page-x grid items-center gap-8 pt-8 pb-12 md:pt-12 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-20">
      <div className="hero-seq lg:col-span-7">
        <p className="type-caption text-brand-ink">{t('home.eyebrow')}</p>
        <h1 className="hero-title mt-3 type-display-xl text-ink md:max-w-[16ch]">{t('home.title')}</h1>
        <p className="mt-4 max-w-xl type-body-lg text-muted">{t('home.sub')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button to="/planner" className="w-full sm:w-auto">
            {t('home.ctaPrimary')}
          </Button>
          <Button to="/recipes" variant="secondary" className="w-full sm:w-auto">
            {t('home.ctaSecondary')}
          </Button>
        </div>
        <p className="mt-6 text-sm font-medium text-muted">{t('home.stat')}</p>
      </div>
      <div className="lg:col-span-5">
        <RecipeImage id="home-hero" alt={t('home.heroAlt')} priority sizes={HERO_SIZES} className="hero-image block aspect-[4/3] overflow-hidden rounded-2xl shadow-card lg:max-h-[440px]" />
      </div>
    </section>
  );
}
