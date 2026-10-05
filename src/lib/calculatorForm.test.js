import { describe, expect, it } from 'vitest';
import { validateCalculator } from './calculatorForm.js';

const ok = { sex: 'female', age: '30', heightCm: '165', weightKg: '60', activity: 'moderate' };

describe('calculator validation (PRD §7.2)', () => {
  it('accepts the PRD example', () => {
    expect(validateCalculator(ok).profile).toEqual({ sex: 'female', age: 30, heightCm: 165, weightKg: 60, activity: 'moderate' });
  });
  it('rejects age 12, empty fields and no gender with the PRD messages', () => {
    expect(validateCalculator({ ...ok, age: '12' }).errors).toEqual({ age: 'age' });
    expect(validateCalculator({}).errors).toEqual({ sex: 'gender', age: 'required', height: 'required', weight: 'required', activity: 'required' });
    expect(validateCalculator({ ...ok, heightCm: '250', weightKg: '20' }).errors).toEqual({ height: 'height', weight: 'weight' });
  });
  it('US units: feet and inches, pounds', () => {
    const r = validateCalculator({ sex: 'male', age: '40', ft: '5', in: '10', lb: '180', activity: 'light' }, 'us');
    expect(r.profile.heightCm).toBeCloseTo(177.8, 1);
    expect(r.profile.weightKg).toBeCloseTo(81.65, 1);
    expect(validateCalculator({ ...ok, ft: '8', in: '0', lb: '150' }, 'us').errors).toEqual({ height: 'heightUs' });
    expect(validateCalculator({ ...ok, ft: '5', in: '13', lb: '150' }, 'us').errors).toEqual({ height: 'heightUs' });
    expect(validateCalculator({ ...ok, ft: '5', in: '5', lb: '600' }, 'us').errors).toEqual({ weight: 'weightUs' });
  });
});
