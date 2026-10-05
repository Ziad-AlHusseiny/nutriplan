import { ChevronDown, Plus, Printer, RotateCcw, Share2, ShoppingBasket, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import WeekSwitcher from '../components/planner/WeekSwitcher.jsx';
import ShoppingRow from '../components/shopping/ShoppingRow.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import { getRecipe } from '../data/recipes.js';
import { ingredientName, shoppingLine } from '../data/text.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { usePlanWeek } from '../hooks/usePlanWeek.js';
import { useResolver } from '../hooks/useResolver.js';
import { useStored } from '../hooks/useStored.js';
import { t } from '../i18n/index.js';
import { formatDate, formatList } from '../lib/format.js';
import { entriesOf } from '../lib/plan.js';
import { compareText } from '../lib/search.js';
import { buildShoppingList, groupByAisle, rowQuantities, shareText } from '../lib/shopping.js';
import { pantryStore, shoppingStore, unitsStore } from '../lib/stores.js';
import { toast } from '../lib/toast.js';
import { DAYS, parseKey, todayIndex } from '../lib/week.js';

const EMPTY_STATE = { checked: [], extras: [] };

/**
 * /shopping (BUILD-LOG): the week's ingredients merged across recipes and
 * servings, by aisle. Tick items off in the store (saved per week), mark
 * what you already have, add your own extras, share as text, or print.
 */
export default function ShoppingPage() {
  useDocumentTitle(t('meta.pages.shopping.title'));
  const { hydrated, key, thisWeek, week, setWeek } = usePlanWeek();
  const resolve = useResolver();
  const [shopping] = useStored(shoppingStore);
  const [pantry, setPantry] = useStored(pantryStore);
  const [system, setSystem] = useStored(unitsStore);
  const [extra, setExtra] = useState('');
  const state = (key && shopping.weeks[key]) || EMPTY_STATE;
  const today = key ? todayIndex(key) : -1;
  const saved = (state.days ?? DAYS).filter((d) => DAYS.includes(d));
  const days = saved.length ? saved : DAYS;

  const update = (patch) => shoppingStore.set((s) => ({ weeks: { ...s.weeks, [key]: { ...EMPTY_STATE, ...s.weeks[key], ...patch(s.weeks[key] ?? EMPTY_STATE) } } }));

  const entries = useMemo(() => entriesOf(week).filter((e) => days.includes(e.day)), [week, days]);
  const list = useMemo(() => buildShoppingList(entries, getRecipe), [entries]);
  const lineOf = (row) => shoppingLine(row, rowQuantities(row, system), system);
  const toBuy = list.rows.filter((r) => !pantry.includes(r.item));
  const have = list.rows.filter((r) => pantry.includes(r.item));
  const groups = groupByAisle(toBuy, (r) => ingredientName(r.item, 2), compareText);
  const checked = new Set(state.checked);
  const done = toBuy.filter((r) => checked.has(r.item)).length + state.extras.filter((e) => e.checked).length;
  const total = toBuy.length + state.extras.length;
  const skipped = list.skipped.map((id) => resolve(id)?.title).filter(Boolean);
  const weekLabel = key ? t('shopping.week', { date: formatDate(parseKey(key), { day: 'numeric', month: 'long' }) }) : '';

  const toggle = (item) => update((w) => ({ checked: w.checked.includes(item) ? w.checked.filter((x) => x !== item) : [...w.checked, item] }));

  async function share() {
    const text = shareText({
      title: `${t('shopping.shareTitle')} · ${weekLabel}`,
      groups: groups.map((g) => ({ ...g, rows: g.rows.filter((r) => !checked.has(r.item)) })),
      lineOf,
      aisleName: (a) => t(`shopping.aisles.${a}`),
      extras: state.extras,
      extrasTitle: t('shopping.extras'),
      footer: `${t('shopping.shareFooter')} · nutriplan-lf-2.vercel.app`,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('shopping.shareTitle'), text });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(t('shopping.copied'));
    } catch {
      toast(text.slice(0, 120));
    }
  }

  function addExtra(e) {
    e.preventDefault();
    const text = extra.trim();
    if (!text || !key) return;
    update((w) => ({ extras: [...w.extras, { id: Math.random().toString(36).slice(2, 9), text: text.slice(0, 120), checked: false }] }));
    setExtra('');
  }

  const setDays = (next) => update(() => ({ days: next.length === 7 ? undefined : next }));
  const hasMeals = hydrated && entries.length > 0;

  return (
    <div className="page-x pt-8 md:pt-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-print="hide">
        <div className="max-w-2xl">
          <h1 className="type-display-lg text-ink">{t('shopping.title')}</h1>
          <p className="mt-3 type-body-lg text-muted">{t('shopping.sub')}</p>
        </div>
        <WeekSwitcher weekKey={key} thisWeek={thisWeek} onChange={setWeek} />
      </header>
      <h2 className="hidden text-2xl font-bold print:block">
        {t('shopping.title')} · {weekLabel}
      </h2>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4 shadow-card md:p-5" aria-label={t('shopping.days')} data-print="hide">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-caption me-1 text-muted">{t('shopping.days')}</span>
          <FilterChip label={t('shopping.allDays')} selected={days.length === 7} onToggle={() => setDays(DAYS)} data-testid="days-all" />
          {today > 0 && <FilterChip label={t('shopping.fromToday')} selected={days.length === 7 - today && days[0] === DAYS[today]} onToggle={() => setDays(DAYS.slice(today))} data-testid="days-from-today" />}
          {DAYS.map((d) => (
            <FilterChip
              key={d}
              label={t(`daysShort.${d}`)}
              aria-label={t(`days.${d}`)}
              selected={days.includes(d) && days.length < 7}
              onToggle={() => setDays(days.length === 7 ? [d] : days.includes(d) ? days.filter((x) => x !== d) : DAYS.filter((x) => x === d || days.includes(x)))}
              data-testid={`day-chip-${d}`}
            />
          ))}
        </div>
      </section>

      {!hasMeals ? (
        <div className="mt-8">
          <EmptyState icon={ShoppingBasket} title={t('shopping.empty.title')} body={t('shopping.empty.body')} actionLabel={t('shopping.empty.action')} actionTo="/planner" actionVariant="primary" />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
            <p className="me-auto font-semibold text-ink" aria-live="polite" data-testid="to-buy">
              {t('shopping.toBuy', { count: total - done })}
              <span className="ms-2 font-normal text-muted">· {t('shopping.progress', { done, total })}</span>
            </p>
            <SegmentedControl
              legend={t('unitSystem.label')}
              legendClassName="sr-only"
              size="sm"
              value={system}
              onChange={setSystem}
              options={[
                { value: 'metric', label: t('unitSystem.metric') },
                { value: 'us', label: t('unitSystem.us') },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={share} data-testid="share-list">
              <Share2 aria-hidden="true" size={16} />
              {t('shopping.share')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" size={16} />
              {t('shopping.print')}
            </Button>
            {done > 0 && (
              <Button variant="ghost" size="sm" onClick={() => update((w) => ({ checked: [], extras: w.extras.map((e) => ({ ...e, checked: false })) }))}>
                <RotateCcw aria-hidden="true" size={16} />
                {t('shopping.uncheckAll')}
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="space-y-4" data-print="list">
              {groups.map((g) => (
                <section key={g.aisle} aria-labelledby={`aisle-${g.aisle}`} className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-card md:px-5" data-print="group" data-testid={`aisle-${g.aisle}`}>
                  <h2 id={`aisle-${g.aisle}`} className="type-caption pt-2 text-brand-ink">
                    {t(`shopping.aisles.${g.aisle}`)}
                  </h2>
                  <ul className="divide-y divide-line">
                    {g.rows.map((row) => (
                      <ShoppingRow key={row.item} row={row} line={lineOf(row)} checked={checked.has(row.item)} onToggle={() => toggle(row.item)} onHave={() => setPantry((p) => [...p, row.item])} />
                    ))}
                  </ul>
                </section>
              ))}
              {state.extras.length > 0 && (
                <section aria-labelledby="extras-title" className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-card md:px-5" data-print="group">
                  <h2 id="extras-title" className="type-caption pt-2 text-brand-ink">
                    {t('shopping.extras')}
                  </h2>
                  <ul className="divide-y divide-line">
                    {state.extras.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 py-2" data-testid="extra-row">
                        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                          <input type="checkbox" className="size-6 shrink-0 accent-(--color-brand-fill)" checked={e.checked} onChange={() => update((w) => ({ extras: w.extras.map((x) => (x.id === e.id ? { ...x, checked: !x.checked } : x)) }))} />
                          <span className={e.checked ? 'text-muted line-through' : 'text-ink'}>{e.text}</span>
                        </label>
                        <button type="button" onClick={() => update((w) => ({ extras: w.extras.filter((x) => x.id !== e.id) }))} className="grid size-10 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink" aria-label={t('shopping.removeExtra', { text: e.text })} data-print="hide">
                          <X aria-hidden="true" size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24" data-print="hide">
              <form onSubmit={addExtra} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <label htmlFor="extra-item" className="type-caption text-muted">
                  {t('shopping.addLabel')}
                </label>
                <div className="mt-2 flex gap-2">
                  <input id="extra-item" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={t('shopping.addPlaceholder')} maxLength={120} className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-ink placeholder:text-muted/70 focus:border-brand" data-testid="extra-input" />
                  <Button type="submit" size="icon" aria-label={t('shopping.add')} data-testid="extra-add">
                    <Plus aria-hidden="true" size={20} />
                  </Button>
                </div>
              </form>

              {have.length > 0 && (
                <details className="group rounded-2xl border border-line bg-surface p-4 shadow-card" data-testid="already-have">
                  <summary className="flex min-h-8 items-center justify-between font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {t('shopping.alreadyHave', { count: have.length })}
                    <ChevronDown aria-hidden="true" size={18} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm text-muted">{t('shopping.alreadyHaveHint')}</p>
                  <ul className="mt-2 divide-y divide-line">
                    {have.map((row) => (
                      <li key={row.item} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-ink">{ingredientName(row.item, 2)}</span>
                        <button type="button" onClick={() => setPantry((p) => p.filter((x) => x !== row.item))} className="min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold text-brand-ink hover:bg-subtle" aria-label={t('shopping.needLabel', { name: ingredientName(row.item, 2) })} data-testid="need-it">
                          {t('shopping.need')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {skipped.length > 0 && <p className="rounded-2xl bg-subtle p-4 text-sm text-muted">{t('shopping.skipped', { count: skipped.length, names: formatList(skipped) })}</p>}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
