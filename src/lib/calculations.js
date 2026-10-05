// Nutrition math (TECHNICAL-PLAN §2 lib/calculations.js): Mifflin-St Jeor
// BMR and TDEE (PRD §7.2), goal targets with safety floors (BUILD-LOG),
// macro shares for the donut and rings (PRD §5.5), and ingredient scaling.

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };
export const MACROS = ['protein', 'carbs', 'fat'];

/** Mifflin-St Jeor. sex: 'female' | 'male'; kg, cm, years. Whole kcal. */
export function bmr({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

/** TDEE = BMR × activity multiplier, whole kcal (from the unrounded BMR, as the PRD example does). */
export function tdee(profile, multiplier) {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
  return Math.round(base * multiplier);
}

export const roundTo10 = (n) => Math.round(n / 10) * 10;

// The goal presets (PRD §7.3), plus a gentler cut (BUILD-LOG).
export const GOALS = [
  { id: 'lose', adjust: -500 },
  { id: 'lose-slow', adjust: -250 },
  { id: 'maintain', adjust: 0 },
  { id: 'gain', adjust: 300 },
];
export const goalById = (id) => GOALS.find((g) => g.id === id) ?? GOALS[2];

/**
 * Commonly cited minimums for unsupervised eating (no lower without a
 * doctor or dietitian): 1,200 kcal a day for women, 1,500 for men.
 */
export const KCAL_FLOOR = { female: 1200, male: 1500 };

/**
 * The daily target for a goal, with the safety rules:
 * - never below the floor for the user's sex, nor below their BMR when cutting;
 * - no weight-loss target under 18 (the lose goals are unavailable);
 * - a warning when the cut is steep (more than 25% under TDEE).
 * Returns { target, floored, steep, minor }.
 */
export function dailyTarget({ tdee: total, bmr: rest, sex, age }, goalId) {
  const goal = goalById(goalId);
  const minor = age < 18;
  const adjust = minor && goal.adjust < 0 ? 0 : goal.adjust;
  const raw = roundTo10(total + adjust);
  const floor = adjust < 0 ? Math.max(KCAL_FLOOR[sex] ?? 1200, roundTo10(rest)) : 0;
  const target = Math.max(raw, floor);
  return {
    target,
    floored: target > raw,
    steep: adjust < 0 && (total - target) / total > 0.25,
    minor,
  };
}

/** Protein per kg of body weight for a goal (higher when cutting or building). */
export const PROTEIN_PER_KG = { lose: 1.6, 'lose-slow': 1.4, maintain: 1.2, gain: 1.8 };

/**
 * Daily macro targets: protein from body weight, fat at 30% of calories,
 * carbs fill the rest. Grams, whole numbers.
 */
export function macroTargets(kcal, { weightKg, goal = 'maintain' } = {}) {
  const protein = weightKg ? Math.round(Math.min(weightKg * (PROTEIN_PER_KG[goal] ?? 1.2), (kcal * 0.35) / 4)) : Math.round((kcal * 0.2) / 4);
  const fat = Math.round((kcal * 0.3) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

/** Default macro targets when only a kcal target is known: 20 / 50 / 30. */
export const defaultMacroTargets = (kcal) => ({
  protein: Math.round((kcal * 0.2) / 4),
  carbs: Math.round((kcal * 0.5) / 4),
  fat: Math.round((kcal * 0.3) / 9),
});

/**
 * Each macro's share of the recipe's calories (PRD §5.5: protein 42 g of a
 * 520 kcal recipe fills 32%), and the donut's segments: the same calorie
 * contributions normalized to sum to exactly 1, so rounding never leaves a gap.
 */
export function macroShares({ kcal, protein, carbs, fat }) {
  const cal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const sum = cal.protein + cal.carbs + cal.fat || 1;
  const ofKcal = {};
  const segments = {};
  for (const m of MACROS) {
    ofKcal[m] = kcal ? cal[m] / kcal : 0;
    segments[m] = cal[m] / sum;
  }
  return { ofKcal, segments };
}

/** Scales an ingredient amount by selectedServings / baseServings (null stays null). */
export const scaleAmount = (amount, servings, baseServings) => (amount == null ? null : (amount * servings) / baseServings);
