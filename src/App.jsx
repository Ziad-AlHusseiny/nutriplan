import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout.jsx';
import { pageLoaders } from './routes.js';

// Every page is its own chunk (TECHNICAL-PLAN §8). The prerendered HTML
// already shows the page, and it hydrates as soon as its chunk arrives.
const HomePage = lazy(pageLoaders.home);
const RecipesPage = lazy(pageLoaders.recipes);
const RecipeDetailPage = lazy(pageLoaders.recipe);
const PlannerPage = lazy(pageLoaders.planner);
const ShoppingPage = lazy(pageLoaders.shopping);
const CalculatorPage = lazy(pageLoaders.calculator);
const PrivacyPage = lazy(pageLoaders.privacy);
const NotFoundPage = lazy(pageLoaders.notFound);

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
