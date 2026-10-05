import { Check } from 'lucide-react';
import { recipeById } from '../../data/recipes.js';
import { ingredientName, recipeTitle } from '../../data/text.js';
import { t } from '../../i18n/index.js';
import { formatList } from '../../lib/format.js';

/** One item: a big checkbox (tick it off in the store), the merged amount, what it's for, and "Have it". */
export default function ShoppingRow({ row, line, checked, onToggle, onHave }) {
  const id = `item-${row.item}`;
  const forWhat = formatList(row.recipes.map((rid) => recipeTitle(recipeById.get(rid))));
  return (
    <li className="flex items-start gap-3 py-2" data-testid="shopping-row" data-item={row.item} data-checked={checked || undefined}>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={onToggle} data-testid="shopping-check" />
      <label htmlFor={id} data-testid="shopping-label" className="flex min-h-12 flex-1 cursor-pointer items-start gap-3 rounded-lg py-1 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        <span aria-hidden="true" className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border-2 transition-colors duration-(--duration-tap) ${checked ? 'border-brand-fill bg-brand-fill text-on-brand' : 'border-line bg-surface'}`}>
          {checked && <Check size={16} strokeWidth={3} />}
        </span>
        <span className="min-w-0">
          <span className={`block font-medium transition-colors ${checked ? 'text-muted line-through decoration-muted/60' : 'text-ink'}`} data-testid="shopping-line">
            {line}
          </span>
          <span className="block text-xs text-muted" data-print="hide">
            {t('shopping.usedIn', { recipes: forWhat })}
          </span>
        </span>
      </label>
      <button
        type="button"
        onClick={onHave}
        className="mt-1 min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-subtle hover:text-ink"
        aria-label={t('shopping.haveLabel', { name: ingredientName(row.item, 2) })}
        data-print="hide"
        data-testid="have-it"
      >
        {t('shopping.have')}
      </button>
    </li>
  );
}
