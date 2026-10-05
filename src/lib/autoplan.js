// "Fill my week": fills the empty slots of a week so each day lands within
// a tolerance of the daily kcal target. Deterministic (same inputs, same
// plan; no randomness, ties broken by the collection's order) and
// explainable (every pick carries the slot's aim and the rules it followed).
//
// The rules, in order:
//   1. Never touch a slot that already has a meal.
//   2. Only recipes that suit the slot (breakfast, lunch/dinner, snacks) and
//      pass every chosen diet (vegan AND keto means both).
//   3. A recipe at most twice a week and never twice in one day. If the
//      diet leaves too few options, the cap rises one step at a time and the
//      result says so.
//   4. The day's remaining calories are split across its empty slots
//      (breakfast 25%, lunch 35%, dinner 30%, snacks 10%), and each slot
//      takes the recipe and servings (½, 1, 1½ or 2) closest to its share,
//      nudged toward the protein target, favorites, a single serving, and
//      variety (not the same dish in the same slot two days running).
//   5. Then each day is fine-tuned: auto-filled slots are swapped or
//      re-portioned while that brings the day closer to the target. Going
//      over costs ten times more than staying under (the planner turns a
//      day red the moment it's over), so days land on or just under it.

import { DAYS, SLOTS } from './week.js';

export const SLOT_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snacks: 0.1 };
export const SERVING_OPTIONS = { breakfast: [0.5, 1, 1.5, 2], lunch: [0.5, 1, 1.5, 2], dinner: [0.5, 1, 1.5, 2], snacks: [0.5, 1, 1.5] };
export const DEFAULT_TOLERANCE = 0.05;
export const MAX_REPEATS = 2;
/** Diets that restrict; "high-protein" is a preference (rule 4), not a filter. */
export const RESTRICTIONS = ['vegan', 'vegetarian', 'keto'];

const suits = (recipe, slot) => recipe.meals.includes(slot);

/** Recipes allowed in a slot under the chosen diets. */
export function candidatesFor(slot, recipes, diets = [], exclude = []) {
  const restrictions = diets.filter((d) => RESTRICTIONS.includes(d));
  const banned = new Set(exclude);
  const pool = recipes.filter((r) => !banned.has(r.id) && restrictions.every((d) => r.diets.includes(d)));
  const direct = pool.filter((r) => suits(r, slot));
  if (direct.length || slot === 'breakfast' || slot === 'snacks') return direct;
  // Lunch and dinner share mains when one of them runs dry.
  return pool.filter((r) => r.meals.includes('lunch') || r.meals.includes('dinner'));
}

/**
 * @param {object} args
 * @param {object} args.week        the week (day → slot → entry|null); not mutated
 * @param {Array}  args.recipes     the collection, in its fixed order
 * @param {Function} args.resolve   id → { kcal, protein, … } for existing entries (recipes and custom meals)
 * @param {object} args.targets     { kcal, protein? }
 * @param {string[]} [args.diets]   chosen diet chips
 * @param {string[]} [args.favorites]
 * @param {string[]} [args.days]    days to fill (default all seven)
 * @param {string[]} [args.slots]   slots to fill (default all four)
 * @param {number} [args.tolerance] ±fraction of the target that counts as "on target"
 */
export function fillWeek({ week, recipes, resolve, targets, diets = [], favorites = [], days = DAYS, slots = SLOTS, tolerance = DEFAULT_TOLERANCE }) {
  const target = targets.kcal;
  const proteinTarget = targets.protein ?? 0;
  const preferProtein = diets.includes('high-protein');
  const favs = new Set(favorites);
  const order = new Map(recipes.map((r, i) => [r.id, i]));
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const next = structuredClone(week);
  const filled = [];
  const unfilled = [];
  const relaxed = new Set();
  // The repeat cap each slot type ended up needing (rule 3).
  const capFor = Object.fromEntries(SLOTS.map((slot) => [slot, MAX_REPEATS]));

  // Uses across the whole week (existing meals count too).
  const uses = new Map();
  for (const day of DAYS) for (const slot of SLOTS) if (next[day][slot]) uses.set(next[day][slot].id, (uses.get(next[day][slot].id) ?? 0) + 1);
  const used = (id) => uses.get(id) ?? 0;
  const bump = (id, n) => uses.set(id, used(id) + n);

  const food = (entry) => (entry ? (byId.get(entry.id) ?? resolve(entry.id)) : null);
  const dayTotal = (day) =>
    SLOTS.reduce(
      (acc, slot) => {
        const f = food(next[day][slot]);
        if (!f) return acc;
        const n = next[day][slot].servings ?? 1;
        return { kcal: acc.kcal + f.kcal * n, protein: acc.protein + (f.protein ?? 0) * n };
      },
      { kcal: 0, protein: 0 },
    );

  const pool = Object.fromEntries(SLOTS.map((slot) => [slot, candidatesFor(slot, recipes, diets)]));

  /** Cost of putting `recipe` × `servings` in a slot aiming for `aim` kcal. Lower is better. */
  function cost(recipe, servings, { aim, proteinAim, day, slot }) {
    const kcal = recipe.kcal * servings;
    let c = Math.abs(kcal - aim) / Math.max(aim, 1);
    if (proteinAim > 0) {
      const shortfall = Math.max(0, proteinAim - recipe.protein * servings) / proteinAim;
      c += (preferProtein ? 0.6 : 0.25) * shortfall;
    }
    if (favs.has(recipe.id)) c -= 0.05;
    c += servings < 1 && slot !== 'snacks' ? 0.12 : 0.04 * Math.abs(servings - 1);
    const prev = DAYS[DAYS.indexOf(day) - 1];
    if (prev && next[prev][slot]?.id === recipe.id) c += 0.3;
    return c;
  }

  const inDay = (day, id) => SLOTS.some((s) => next[day][s]?.id === id);

  /** Best (recipe, servings) for a slot under a repeat cap; deterministic tie-break. */
  function pick(ctx, cap, { ignoreSlotOf } = {}) {
    let best = null;
    for (const recipe of pool[ctx.slot]) {
      const usedHere = ignoreSlotOf?.id === recipe.id ? 1 : 0;
      if (used(recipe.id) - usedHere >= cap) continue;
      if (inDay(ctx.day, recipe.id) && ignoreSlotOf?.id !== recipe.id) continue;
      for (const servings of SERVING_OPTIONS[ctx.slot]) {
        const c = cost(recipe, servings, ctx);
        if (!best || c < best.cost - 1e-9 || (Math.abs(c - best.cost) <= 1e-9 && (order.get(recipe.id) < order.get(best.recipe.id) || (recipe.id === best.recipe.id && servings < best.servings)))) {
          best = { recipe, servings, cost: c };
        }
      }
    }
    return best;
  }

  for (const day of days) {
    const empty = slots.filter((slot) => !next[day][slot]);
    if (!empty.length) continue;
    const { kcal: fixed, protein: fixedProtein } = dayTotal(day);
    const remaining = target - fixed;
    if (remaining <= target * tolerance) {
      for (const slot of empty) unfilled.push({ day, slot, reason: 'day-full' });
      continue;
    }
    const shareSum = empty.reduce((acc, slot) => acc + SLOT_SHARE[slot], 0);
    const remainingProtein = Math.max(0, proteinTarget - fixedProtein);
    const auto = [];
    const ceiling = target * (1 + tolerance);
    for (const slot of empty) {
      const share = SLOT_SHARE[slot] / shareSum;
      const ctx = { day, slot, aim: remaining * share, proteinAim: remainingProtein * share };
      const smallest = Math.min(...pool[slot].map((r) => r.kcal * SERVING_OPTIONS[slot][0]));
      if (pool[slot].length && dayTotal(day).kcal + smallest > ceiling) {
        unfilled.push({ day, slot, reason: 'day-full' });
        continue;
      }
      let best = pick(ctx, capFor[slot]);
      while (!best && capFor[slot] < 7 && pool[slot].length) {
        capFor[slot] += 1;
        relaxed.add(slot);
        best = pick(ctx, capFor[slot]);
      }
      if (!best) {
        unfilled.push({ day, slot, reason: pool[slot].length ? 'no-variety' : 'no-recipes' });
        continue;
      }
      next[day][slot] = { id: best.recipe.id, servings: best.servings };
      bump(best.recipe.id, 1);
      auto.push({ slot, ctx });
    }

    // Fine-tune: swap or re-portion auto-filled slots while the day gets closer.
    const miss = (total) => (total > target ? 10 * (total - target) : target - total);
    for (let round = 0; round < 12; round += 1) {
      const total = dayTotal(day).kcal;
      const gap = miss(total);
      if (total <= target && gap <= target * tolerance * 0.5) break;
      let bestMove = null;
      for (const { slot, ctx } of auto) {
        const current = next[day][slot];
        const currentKcal = byId.get(current.id).kcal * current.servings;
        const others = total - currentKcal;
        for (const recipe of pool[slot]) {
          const self = recipe.id === current.id;
          if (!self && (used(recipe.id) >= capFor[slot] || inDay(day, recipe.id))) continue;
          for (const servings of SERVING_OPTIONS[slot]) {
            if (self && servings === current.servings) continue;
            const newGap = miss(others + recipe.kcal * servings);
            const score = newGap + 0.02 * target * cost(recipe, servings, { ...ctx, aim: target - others });
            if (newGap < gap - 1 && (!bestMove || score < bestMove.score - 1e-9)) bestMove = { slot, recipe, servings, score };
          }
        }
      }
      if (!bestMove) break;
      const old = next[day][bestMove.slot];
      if (old.id !== bestMove.recipe.id) {
        bump(old.id, -1);
        bump(bestMove.recipe.id, 1);
      }
      next[day][bestMove.slot] = { id: bestMove.recipe.id, servings: bestMove.servings };
    }

    // Still over the ceiling (a narrow diet, a big meal already planned):
    // drop auto-filled slots, the one that helps most first, and say so.
    while (dayTotal(day).kcal > ceiling && auto.length) {
      let best = null;
      for (const a of auto) {
        const entry = next[day][a.slot];
        const without = dayTotal(day).kcal - byId.get(entry.id).kcal * entry.servings;
        const score = miss(without);
        if (!best || score < best.score) best = { a, score };
      }
      if (best.score >= miss(dayTotal(day).kcal)) break;
      bump(next[day][best.a.slot].id, -1);
      next[day][best.a.slot] = null;
      auto.splice(auto.indexOf(best.a), 1);
      unfilled.push({ day, slot: best.a.slot, reason: 'day-full' });
    }

    for (const { slot, ctx } of auto) {
      const entry = next[day][slot];
      filled.push({ day, slot, id: entry.id, servings: entry.servings, kcal: byId.get(entry.id).kcal * entry.servings, aim: Math.round(ctx.aim) });
    }
  }

  const summary = days.map((day) => {
    const { kcal } = dayTotal(day);
    return { day, kcal, within: Math.abs(kcal - target) <= target * tolerance };
  });

  return { week: next, filled, unfilled, relaxed: [...relaxed], days: summary, tolerance };
}
