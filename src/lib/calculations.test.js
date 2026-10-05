import { describe, expect, it } from 'vitest';
import { recipes } from '../data/recipes.js';
import { bmr, dailyTarget, defaultMacroTargets, macroShares, macroTargets, roundTo10, scaleAmount, tdee } from './calculations.js';
import { cmFromFtIn, ftInFromCm, kgFromLb, lbFromKg } from './units.js';

const example = { sex: 'female', age: 30, heightCm: 165, weightKg: 60 };

describe('Mifflin-St Jeor (PRD §7.2)', () => {
  it('PRD worked example: F/30/165/60, moderate → BMR 1,320, TDEE 2,046', () => {
    expect(bmr(example)).toBe(1320);
    expect(tdee(example, 1.55)).toBe(2046);
  });

  it('male formula adds 5', () => {
    expect(bmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 80 })).toBe(Math.round(800 + 1125 - 150 + 5));
  });

  it('imperial inputs convert to the same result', () => {
    const cm = cmFromFtIn(5, 5);
    const kg = kgFromLb(132.28);
    expect(bmr({ ...example, heightCm: cm, weightKg: kg })).toBeCloseTo(1320, -1);
    expect(ftInFromCm(165)).toEqual({ ft: 5, in: 5 });
    expect(ftInFromCm(182.88)).toEqual({ ft: 6, in: 0 });
    expect(Math.round(lbFromKg(60))).toBe(132);
  });
});

describe('daily target and safety (PRD §7.3 + BUILD-LOG)', () => {
  const base = { tdee: 2046, bmr: 1320, sex: 'female', age: 30 };
  it('maintain = TDEE to the nearest 10; lose −500 → 1,550 (PRD example)', () => {
    expect(dailyTarget(base, 'maintain').target).toBe(2050);
    expect(dailyTarget(base, 'lose').target).toBe(1550);
    expect(dailyTarget(base, 'lose').floored).toBe(false);
    expect(dailyTarget(base, 'gain').target).toBe(2350);
    expect(dailyTarget(base, 'lose-slow').target).toBe(1800);
  });

  it('never goes below 1,200 (women) / 1,500 (men) or below BMR when cutting', () => {
    const small = { tdee: 1500, bmr: 1150, sex: 'female', age: 60 };
    const r = dailyTarget(small, 'lose');
    expect(r.target).toBe(1200);
    expect(r.floored).toBe(true);
    const man = dailyTarget({ tdee: 1900, bmr: 1550, sex: 'male', age: 40 }, 'lose');
    expect(man.target).toBe(1550);
    expect(man.floored).toBe(true);
  });

  it('flags a steep cut and offers no weight loss under 18', () => {
    expect(dailyTarget({ tdee: 1900, bmr: 1300, sex: 'female', age: 40 }, 'lose').steep).toBe(true);
    expect(dailyTarget(base, 'lose').steep).toBe(false);
    const teen = dailyTarget({ tdee: 2200, bmr: 1500, sex: 'male', age: 16 }, 'lose');
    expect(teen.minor).toBe(true);
    expect(teen.target).toBe(2200);
  });

  it('rounds to the nearest 10', () => {
    expect(roundTo10(1546)).toBe(1550);
    expect(roundTo10(1544)).toBe(1540);
  });

  it('macro targets: protein by body weight, fat 30%, carbs the rest', () => {
    const m = macroTargets(2000, { weightKg: 70, goal: 'lose' });
    expect(m.protein).toBe(112);
    expect(m.fat).toBe(67);
    expect(m.protein * 4 + m.carbs * 4 + m.fat * 9).toBeGreaterThan(1990);
    expect(defaultMacroTargets(2000)).toEqual({ protein: 100, carbs: 250, fat: 67 });
  });
});

describe('macro shares (PRD §5.5)', () => {
  it('42 g protein of 520 kcal fills 32%, carbs 29%, fat 36%', () => {
    const { ofKcal } = macroShares({ kcal: 520, protein: 42, carbs: 38, fat: 21 });
    expect(Math.round(ofKcal.protein * 100)).toBe(32);
    expect(Math.round(ofKcal.carbs * 100)).toBe(29);
    expect(Math.round(ofKcal.fat * 100)).toBe(36);
  });

  it('donut segments sum to exactly 1 for every recipe (no gap)', () => {
    for (const r of recipes) {
      const { segments } = macroShares(r);
      expect(segments.protein + segments.carbs + segments.fat).toBeCloseTo(1, 10);
    }
  });
});

describe('ingredient scaling (PRD §5.3)', () => {
  it('300 g for 2 servings becomes 450 g for 3', () => {
    expect(scaleAmount(300, 3, 2)).toBe(450);
  });
  it('"to taste" (null) never scales', () => {
    expect(scaleAmount(null, 8, 2)).toBeNull();
  });
});
