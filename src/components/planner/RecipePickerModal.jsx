import { ChefHat, Heart, Plus, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { recipes } from '../../data/recipes.js';
import { recipeTitle, searchText } from '../../data/text.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useStored } from '../../hooks/useStored.js';
import { t } from '../../i18n/index.js';
import { num } from '../../lib/format.js';
import { matchesQuery } from '../../lib/search.js';
import { mealsStore } from '../../lib/stores.js';
import Modal from '../ui/Modal.jsx';
import RecipeImage from '../ui/RecipeImage.jsx';

const TABS = ['all', 'favorites', 'mine'];

/**
 * "Add to Tuesday · Lunch" (PRD §6.3): searchable list of every recipe
 * (recipes that suit the slot first), plus your favorites and your own
 * meals. Picking a row fills the slot and closes; focus goes back to it.
 */
export default function RecipePickerModal({ open, day, slot, onSelect, onClose, onNewMeal, returnFocus }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  // Every opening starts with an empty search (and the slot's own list).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery('');
  }
  const [favorites] = useFavorites();
  const [meals] = useStored(mealsStore);
  const searchRef = useRef(null);

  const rows = useMemo(() => {
    if (tab === 'mine') {
      return meals.filter((m) => matchesQuery(m.name, query)).map((m) => ({ id: `custom:${m.id}`, kind: 'custom', title: m.name, kcal: m.kcal }));
    }
    const pool = recipes.filter((r) => (tab === 'favorites' ? favorites.includes(r.id) : true) && matchesQuery(searchText(r), query));
    const suits = (r) => (slot && r.meals.includes(slot) ? 0 : 1);
    return [...pool].sort((a, b) => suits(a) - suits(b)).map((r) => ({ id: r.id, kind: 'recipe', title: recipeTitle(r), kcal: r.kcal, time: r.prepTime, suits: slot && r.meals.includes(slot) }));
  }, [tab, query, favorites, meals, slot]);

  const close = () => {
    onClose();
    setQuery('');
  };
  const title = day && slot ? t('picker.title', { day: t(`days.${day}`), slot: t(`slots.${slot}`) }) : '';

  return (
    <Modal open={open} onClose={close} title={title} initialFocus={searchRef} returnFocus={returnFocus} testId="picker" bodyClassName="!px-0 !pt-0">
      <div className="sticky top-0 z-10 space-y-3 border-b border-line bg-surface px-5 pt-4 pb-3 md:px-6">
        <div className="relative">
          <Search aria-hidden="true" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('picker.search')}
            aria-label={t('picker.search')}
            className="h-11 w-full rounded-md border border-line bg-subtle ps-10 pe-3 text-ink placeholder:text-muted/70 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
            data-testid="picker-search"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label={t('picker.search')}>
          {TABS.map((id) => (
            <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${tab === id ? 'bg-brand-fill text-on-brand' : 'bg-subtle text-ink hover:bg-line'}`} data-testid={`picker-tab-${id}`}>
              {id === 'favorites' && <Heart aria-hidden="true" size={14} />}
              {id === 'mine' && <ChefHat aria-hidden="true" size={14} />}
              {t(`picker.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 md:px-4">
        {tab === 'mine' && (
          <button type="button" onClick={onNewMeal} className="mb-1 flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-start font-semibold text-brand-ink hover:bg-subtle" data-testid="picker-new-meal">
            <span className="grid size-12 place-items-center rounded-md border-[1.5px] border-dashed border-line">
              <Plus aria-hidden="true" size={20} />
            </span>
            {t('picker.newMeal')}
          </button>
        )}
        {rows.length ? (
          <ul data-testid="picker-list">
            {rows.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => onSelect(row.id)} className="flex min-h-14 w-full items-center gap-3 rounded-md p-2 text-start transition-colors hover:bg-subtle focus-visible:bg-subtle" data-testid="picker-row" data-id={row.id}>
                  {row.kind === 'recipe' ? (
                    <RecipeImage id={row.id} alt="" sizes="48px" max={480} className="block size-12 shrink-0 overflow-hidden rounded-md" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink" aria-hidden="true">
                      <ChefHat size={20} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{row.title}</span>
                    <span className="block text-sm text-muted tabular">{row.kind === 'recipe' ? t('picker.meta', { kcal: num(row.kcal), time: num(row.time) }) : t('meal.meta', { kcal: num(row.kcal) })}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-8 text-center text-muted" data-testid="picker-empty">
            {tab === 'favorites' && !query ? t('picker.noFavorites') : tab === 'mine' && !query ? t('picker.noMeals') : t('picker.noMatch')}
          </p>
        )}
      </div>
    </Modal>
  );
}
