import { CalendarPlus, ChefHat, CookingPot } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AddToPlanDialog from '../components/recipes/AddToPlanDialog.jsx';
import CookMode from '../components/recipes/CookMode.jsx';
import FavoriteButton from '../components/recipes/FavoriteButton.jsx';
import IngredientsList from '../components/recipes/IngredientsList.jsx';
import NutritionPanel from '../components/recipes/NutritionPanel.jsx';
import RecipeHero from '../components/recipes/RecipeHero.jsx';
import StepsChecklist from '../components/recipes/StepsChecklist.jsx';
import TimerList from '../components/recipes/TimerList.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { getRecipe } from '../data/recipes.js';
import { recipeTitle } from '../data/text.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useStored } from '../hooks/useStored.js';
import { t } from '../i18n/index.js';
import { unitsStore } from '../lib/stores.js';

function RecipeView({ recipe }) {
  const [servings, setServings] = useState(recipe.servings);
  const [system, setSystem] = useStored(unitsStore);
  const [cooking, setCooking] = useState(false);
  const [adding, setAdding] = useState(false);
  const title = recipeTitle(recipe);
  useDocumentTitle(t('meta.pages.recipe.title', { title }));

  return (
    <article className="page-x pt-6 md:pt-8">
      <Link to="/recipes" className="inline-flex min-h-11 items-center font-semibold text-brand-ink underline-offset-4 hover:underline" data-testid="back-link">
        {t('recipe.back')}
      </Link>
      <div className="mt-2">
        <RecipeHero recipe={recipe}>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setCooking(true)} data-testid="cook-open">
              <ChefHat aria-hidden="true" size={20} />
              {t('recipe.cook')}
            </Button>
            <Button variant="secondary" onClick={() => setAdding(true)} data-testid="add-to-plan-open">
              <CalendarPlus aria-hidden="true" size={20} />
              {t('recipe.addToPlan')}
            </Button>
            <FavoriteButton id={recipe.id} title={title} variant="pill" />
          </div>
          <TimerList recipeId={recipe.id} className="mt-4" />
        </RecipeHero>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-12 lg:gap-8">
        <div className="md:col-span-5 lg:col-span-8 lg:row-start-1">
          <IngredientsList recipe={recipe} servings={servings} onServings={setServings} system={system} onSystem={setSystem} />
        </div>
        <div className="md:col-span-7 lg:col-span-8 lg:row-start-2">
          <StepsChecklist recipe={recipe} />
        </div>
        <aside className="md:col-span-12 lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:self-start">
          <NutritionPanel recipe={recipe} />
        </aside>
      </div>

      <CookMode recipe={recipe} open={cooking} onClose={() => setCooking(false)} servings={servings} system={system} />
      <AddToPlanDialog recipe={recipe} open={adding} onClose={() => setAdding(false)} />
    </article>
  );
}

/** /recipes/:id (PRD §5); an unknown id shows the not-found state (§5.6). */
export default function RecipeDetailPage() {
  const { id } = useParams();
  const recipe = getRecipe(id);
  useDocumentTitle(recipe ? null : t('meta.pages.notFound.title'));
  if (!recipe) {
    return (
      <div className="page-x py-16">
        <EmptyState icon={CookingPot} titleAs="h1" title={t('recipe.notFound.title')} body={t('recipe.notFound.body')} actionLabel={t('recipe.notFound.action')} actionTo="/recipes" actionVariant="primary" />
      </div>
    );
  }
  // A new recipe gets fresh servings, steps and dialogs.
  return <RecipeView key={recipe.id} recipe={recipe} />;
}
