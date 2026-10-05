import { ChevronDown, Heart, Search, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState } from 'react';
import { CUISINES, DIETS, MEALS } from '../../data/recipes.js';
import { t } from '../../i18n/index.js';
import { activeFilterCount, KCAL, TIME, toggleIn } from '../../lib/filters.js';
import { num } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import FilterChip from '../ui/FilterChip.jsx';
import RangeSlider from '../ui/RangeSlider.jsx';

function ChipGroup({ label, children, scroll }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="min-w-0">
      <p id={id} className="type-caption mb-2 text-muted">
        {label}
      </p>
      <div className={scroll ? '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0' : 'flex flex-wrap gap-2'}>{children}</div>
    </div>
  );
}

/**
 * Search, chip groups and sliders (PRD §4.2). Phones: search, then cuisine
 * and diet chips in scrolling rows; meal, favorites and the sliders sit in a
 * "Filters · n" disclosure. 768px and up: everything shown, in three rows
 * (search; cuisine and diet; meal, favorites and the sliders).
 */
export default function RecipeFilters({ filters, onChange, onClear, query, onQuery }) {
  const [open, setOpen] = useState(false);
  const active = activeFilterCount({ ...filters, query });
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <section aria-label={t('recipes.filters')} className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6">
      <div>
        <div className="relative">
          <label htmlFor="recipe-search" className="sr-only">
            {t('recipes.searchLabel')}
          </label>
          <Search aria-hidden="true" size={20} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="recipe-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t('recipes.search')}
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-md border border-line bg-surface ps-11 pe-12 text-ink placeholder:text-muted/70 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
            data-testid="recipe-search"
          />
          {query && (
            <button type="button" onClick={() => onQuery('')} className="absolute end-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink" aria-label={t('recipes.clearSearch')} data-testid="clear-search">
              <X aria-hidden="true" size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5 md:flex-row md:flex-wrap md:gap-x-8">
        <ChipGroup label={t('recipes.cuisine')} scroll>
          {CUISINES.map((c) => (
            <FilterChip key={c} label={t(`cuisines.${c}`)} selected={filters.cuisines.includes(c)} onToggle={() => set({ cuisines: toggleIn(filters.cuisines, c) })} data-testid={`chip-cuisine-${c}`} />
          ))}
        </ChipGroup>
        <ChipGroup label={t('recipes.diet')} scroll>
          {DIETS.map((d) => (
            <FilterChip key={d} label={t(`diets.${d}`)} selected={filters.diets.includes(d)} onToggle={() => set({ diets: toggleIn(filters.diets, d) })} data-testid={`chip-diet-${d}`} />
          ))}
        </ChipGroup>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="more-filters"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl border border-line px-4 font-semibold text-ink md:hidden"
        data-testid="filters-toggle"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" size={18} className="text-brand-ink" />
          {active ? t('recipes.filtersCount', { count: num(active) }) : t('recipes.filters')}
        </span>
        <ChevronDown aria-hidden="true" size={20} className={`transition-transform duration-(--duration-ui) ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Phones: inside the disclosure. 768px and up: always shown. */}
      <div id="more-filters" className={`mt-5 flex-col gap-5 md:flex md:flex-row md:flex-wrap md:items-end md:gap-x-8 ${open ? 'flex' : 'hidden'}`}>
        <ChipGroup label={t('recipes.meal')}>
          {MEALS.map((meal) => (
            <FilterChip key={meal} label={t(`slots.${meal}`)} selected={filters.meals.includes(meal)} onToggle={() => set({ meals: toggleIn(filters.meals, meal) })} data-testid={`chip-meal-${meal}`} />
          ))}
        </ChipGroup>
        <ChipGroup label={t('recipes.favorites')}>
          <FilterChip label={t('recipes.favoritesOnly')} icon={Heart} selected={filters.favoritesOnly} onToggle={() => set({ favoritesOnly: !filters.favoritesOnly })} data-testid="chip-favorites" />
        </ChipGroup>
        <div className="grid gap-4 sm:grid-cols-2 md:min-w-[420px] md:flex-1 lg:max-w-[520px] lg:ms-auto">
          <RangeSlider label={t('recipes.maxCalories')} min={KCAL.min} max={KCAL.max} step={KCAL.step} value={filters.maxKcal} format={(v) => t('common.kcal', { value: num(v) })} onChange={(maxKcal) => set({ maxKcal })} testId="max-kcal" />
          <RangeSlider label={t('recipes.maxTime')} min={TIME.min} max={TIME.max} step={TIME.step} value={filters.maxTime} format={(v) => t('common.minutes', { value: num(v), count: v })} onChange={(maxTime) => set({ maxTime })} testId="max-time" />
        </div>
      </div>

      {active > 0 && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear} data-testid="clear-filters">
            {t('recipes.clearFilters')}
          </Button>
        </div>
      )}
    </section>
  );
}
