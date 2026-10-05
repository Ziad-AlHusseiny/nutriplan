import FeaturedRecipes from '../components/home/FeaturedRecipes.jsx';
import Hero from '../components/home/Hero.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import RealWeek from '../components/home/RealWeek.jsx';
import TodayCard from '../components/home/TodayCard.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { t } from '../i18n/index.js';

/** / (PRD §3): Hero → HowItWorks → FeaturedRecipes, plus today's meals and the real-week tools. */
export default function HomePage() {
  useDocumentTitle(t('meta.title'));
  return (
    <>
      <Hero />
      <HowItWorks />
      <TodayCard />
      <FeaturedRecipes />
      <RealWeek />
    </>
  );
}
