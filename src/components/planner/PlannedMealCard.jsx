import { ChefHat, Ellipsis, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/index.js';
import { formatKcal, formatServings } from '../../lib/format.js';
import RecipeImage from '../ui/RecipeImage.jsx';

/**
 * A planned meal (PRD §6.2): thumbnail, title (linking to the recipe),
 * kcal × servings, and its actions: edit (servings, move or swap) and
 * remove. Draggable to another slot with a mouse; the edit sheet does the
 * same from the keyboard.
 */
export default function PlannedMealCard({ food, entry, dayLabel, slotLabel, onRemove, onEdit, onDragStart }) {
  const kcal = food.kcal * entry.servings;
  return (
    <div
      className="group rounded-xl border border-line bg-surface p-2.5 shadow-card transition-shadow hover:shadow-lift"
      draggable
      onDragStart={onDragStart}
      data-testid="planned-meal"
      data-id={food.id}
    >
      <div className="flex items-center gap-2">
        {food.kind === 'recipe' ? (
          <RecipeImage id={food.id} alt="" sizes="40px" max={480} className="block size-10 shrink-0 overflow-hidden rounded-md" draggable={false} />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink" aria-hidden="true">
            <ChefHat size={18} />
          </span>
        )}
        <p className="min-w-0 text-xs leading-4 font-semibold text-accent-ink tabular">
          {t('common.kcal', { value: formatKcal(kcal) })}
          {entry.servings !== 1 && <span className="block text-muted">{t('common.servingsShort', { value: formatServings(entry.servings) })}</span>}
          {food.kind === 'custom' && <span className="block font-medium text-muted">{t('planner.customTag')}</span>}
        </p>
      </div>
      {food.kind === 'recipe' ? (
        <Link to={`/recipes/${food.id}`} className="mt-1.5 line-clamp-2 text-sm leading-5 font-semibold break-words text-ink hover:text-brand-ink" draggable={false} data-testid="planned-title">
          {food.title}
        </Link>
      ) : (
        <p className="mt-1.5 line-clamp-2 text-sm leading-5 font-semibold break-words text-ink" data-testid="planned-title">
          {food.title}
        </p>
      )}
      <div className="mt-1 -mb-1 flex items-center justify-end gap-1">
        <button type="button" onClick={onEdit} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-ink" aria-label={t('planner.edit', { title: food.title })} data-testid="edit-meal">
          <Ellipsis aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger-ink"
          aria-label={t('planner.remove', { title: food.title, day: dayLabel, slot: slotLabel.toLowerCase() })}
          data-testid="remove-meal"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
