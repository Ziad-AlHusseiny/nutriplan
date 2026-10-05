// Units: metric (the docs) and US customary (BUILD-LOG: reversed non-goal).
// Recipe amounts are authored in metric and kitchen units (tsp, tbsp, pieces);
// display converts weights and volumes on the fly.

export const MASS = { g: 1, kg: 1000 };
export const VOLUME = { ml: 1, l: 1000, tsp: 5, tbsp: 15, cup: 240 };
export const COUNT_UNITS = ['pc', 'clove', 'can', 'slice', 'head'];

export const familyOf = (unit) => (unit in MASS ? 'mass' : unit in VOLUME ? 'volume' : unit ?? 'none');

/** Base amount (g or ml) of an amount in a mass or volume unit. */
export const toBase = (amount, unit) => amount * (MASS[unit] ?? VOLUME[unit] ?? 1);

const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;
const ML_PER_TSP_US = 4.92892;
const ML_PER_TBSP_US = 14.7868;
const ML_PER_CUP_US = 236.588;
const ML_PER_QT_US = 946.353;

/**
 * How an amount should read in a unit system. Spoons and counts never change;
 * grams become kilograms (metric) or ounces/pounds (US); millilitres become
 * litres (metric) or teaspoons, tablespoons, cups and quarts (US).
 */
export function displayQuantity(amount, unit, system = 'metric') {
  if (amount == null || !unit) return { amount, unit };
  const family = familyOf(unit);
  if (family === 'mass') {
    const g = toBase(amount, unit);
    if (system === 'us') return g >= G_PER_LB ? { amount: g / G_PER_LB, unit: 'lb' } : { amount: g / G_PER_OZ, unit: 'oz' };
    return g >= 1000 ? { amount: g / 1000, unit: 'kg' } : { amount: g, unit: 'g' };
  }
  if (family === 'volume' && (unit === 'ml' || unit === 'l')) {
    const ml = toBase(amount, unit);
    if (system === 'us') {
      if (ml < 15) return { amount: ml / ML_PER_TSP_US, unit: 'tsp' };
      if (ml < 60) return { amount: ml / ML_PER_TBSP_US, unit: 'tbsp' };
      if (ml <= ML_PER_QT_US) return { amount: ml / ML_PER_CUP_US, unit: 'cup' };
      return { amount: ml / ML_PER_QT_US, unit: 'qt' };
    }
    return ml >= 1000 ? { amount: ml / 1000, unit: 'l' } : { amount: ml, unit: 'ml' };
  }
  return { amount, unit };
}

// ── Body measurements (the calculator) ──────────────────────────────────
export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

export const kgFromLb = (lb) => lb * KG_PER_LB;
export const lbFromKg = (kg) => kg / KG_PER_LB;
export const cmFromFtIn = (ft, inches) => (ft * 12 + inches) * CM_PER_IN;

/** 165 cm → { ft: 5, in: 5 } (inches rounded, never 12). */
export function ftInFromCm(cm) {
  let total = Math.round(cm / CM_PER_IN);
  const ft = Math.floor(total / 12);
  total -= ft * 12;
  return { ft, in: total };
}
