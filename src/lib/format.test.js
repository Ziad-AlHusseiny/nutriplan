import { describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n/state.js';
import { formatAmount, formatKcal, roundAmount } from './format.js';
import { displayQuantity } from './units.js';

describe('amount rounding (PRD §5.3)', () => {
  it('below 10: one decimal, trailing .0 dropped; 10 and up: whole', () => {
    expect(roundAmount(0.5)).toBe(0.5);
    expect(roundAmount(1.25)).toBe(1.3);
    expect(roundAmount(3.0)).toBe(3);
    expect(roundAmount(9.96)).toBe(10);
    expect(roundAmount(12.5)).toBe(13);
    expect(roundAmount(437.5)).toBe(438);
    setActiveLocale('en');
    expect(formatAmount(3)).toBe('3');
    expect(formatAmount(1.5)).toBe('1.5');
    expect(formatAmount(1200)).toBe('1,200');
  });

  it('keeps numbers left-to-right and in Latin digits in Arabic', () => {
    setActiveLocale('ar');
    expect(formatKcal(1450)).toBe('⁦1,450⁩');
    expect(formatAmount(2.5)).toBe('2.5');
    setActiveLocale('en');
    expect(formatKcal(1450)).toBe('1,450');
  });
});

describe('unit systems', () => {
  it('metric: g → kg and ml → l at 1,000', () => {
    expect(displayQuantity(450, 'g')).toEqual({ amount: 450, unit: 'g' });
    expect(displayQuantity(1200, 'g')).toEqual({ amount: 1.2, unit: 'kg' });
    expect(displayQuantity(1500, 'ml')).toEqual({ amount: 1.5, unit: 'l' });
    expect(displayQuantity(2, 'tbsp')).toEqual({ amount: 2, unit: 'tbsp' });
  });
  it('US: ounces, pounds, cups and quarts; spoons and counts unchanged', () => {
    expect(displayQuantity(300, 'g', 'us').unit).toBe('oz');
    expect(displayQuantity(300, 'g', 'us').amount).toBeCloseTo(10.58, 1);
    expect(displayQuantity(500, 'g', 'us').unit).toBe('lb');
    expect(displayQuantity(240, 'ml', 'us').unit).toBe('cup');
    expect(displayQuantity(1500, 'ml', 'us').unit).toBe('qt');
    expect(displayQuantity(10, 'ml', 'us').unit).toBe('tsp');
    expect(displayQuantity(3, 'pc', 'us')).toEqual({ amount: 3, unit: 'pc' });
  });
});
