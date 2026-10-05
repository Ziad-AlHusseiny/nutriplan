import { describe, expect, it } from 'vitest';
import { matchesQuery, normalize } from './search.js';

describe('search normalization', () => {
  it('ignores case and accents', () => {
    expect(matchesQuery('Jalapeño Chicken', 'jalapeno')).toBe(true);
    expect(matchesQuery('Grilled Lemon Chicken Bowl', 'CHICKEN bowl')).toBe(true);
    expect(matchesQuery('Grilled Lemon Chicken Bowl', 'beef')).toBe(false);
  });

  it('ignores Arabic diacritics and spelling variants', () => {
    expect(normalize('شُوربة')).toBe('شوربه');
    expect(matchesQuery('شوربة عدس', 'شوربه')).toBe(true);
    expect(matchesQuery('أرز بسمتي', 'ارز')).toBe(true);
    expect(matchesQuery('سلطة يونانية', 'يونانيه')).toBe(true);
  });
});
