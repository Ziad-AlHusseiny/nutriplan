import { describe, expect, it } from 'vitest';
import { clock, remaining } from './timers.js';

describe('timers', () => {
  it('formats the countdown', () => {
    expect(clock(15 * 60 * 1000)).toBe('15:00');
    expect(clock(61_000)).toBe('1:01');
    expect(clock(3_725_000)).toBe('1:02:05');
    expect(clock(400)).toBe('0:01');
  });

  it('never shows more than what was left when it started (review finding 9)', () => {
    const now = 1_000_000;
    const timer = { total: 900_000, left: 900_000, endsAt: now + 900_000 };
    // A display clock 3 minutes stale.
    expect(remaining(timer, now - 180_000)).toBe(900_000);
    expect(remaining(timer, now + 60_000)).toBe(840_000);
    expect(remaining({ ...timer, endsAt: null, left: 30_000 }, now)).toBe(30_000);
  });
});
