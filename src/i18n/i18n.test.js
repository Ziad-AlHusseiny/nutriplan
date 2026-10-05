import { afterEach, describe, expect, it } from 'vitest';
import ar from './ar.js';
import en from './en.js';
import { registerDictionary, t } from './index.js';
import { setActiveLocale } from './state.js';

registerDictionary('ar', ar);
afterEach(() => setActiveLocale('en'));

const PLURAL = ['zero', 'one', 'two', 'few', 'many', 'other'];
const isPlural = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => PLURAL.includes(k));
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function shape(node, path = '') {
  if (isPlural(node)) return [`${path}:plural`];
  if (Array.isArray(node)) return [`${path}:array${node.length}`, ...node.flatMap((n, i) => shape(n, `${path}.${i}`))];
  if (node && typeof node === 'object') return Object.keys(node).flatMap((k) => shape(node[k], path ? `${path}.${k}` : k));
  return [`${path}:string`];
}

describe('dictionaries', () => {
  it('Arabic has every English key, with the same shape', () => {
    const enShape = shape(en).map((s) => s.replace(':plural', ':text').replace(':string', ':text'));
    const arShape = shape(ar).map((s) => s.replace(':plural', ':text').replace(':string', ':text'));
    expect(arShape).toEqual(enShape);
  });

  it('keeps every placeholder', () => {
    const walk = (e, a, path) => {
      if (isPlural(e)) return;
      if (typeof e === 'string') {
        if (typeof a === 'string') expect(placeholders(a), path).toEqual(placeholders(e));
        return;
      }
      for (const k of Object.keys(e)) walk(e[k], a[k], `${path}.${k}`);
    };
    walk(en, ar, '');
  });

  it('Arabic plurals: all six forms where it counts', () => {
    setActiveLocale('ar');
    expect(t('recipes.count', { count: 0 })).toBe('لا توجد وصفات');
    expect(t('recipes.count', { count: 1 })).toBe('وصفة واحدة');
    expect(t('recipes.count', { count: 2 })).toBe('وصفتان');
    expect(t('recipes.count', { count: 5 })).toBe('5 وصفات');
    expect(t('recipes.count', { count: 30 })).toBe('30 وصفة');
    expect(t('units.clove', { count: 3 })).toBe('فصوص');
    expect(t('units.clove', { count: 2 })).toBe('فص');
    expect(t('common.minutes', { value: 10, count: 10 })).toBe('10 دقائق');
    expect(t('common.minutes', { value: 25, count: 25 })).toBe('25 دقيقة');
  });

  it('English plurals and the explicit zero form', () => {
    expect(t('recipes.count', { count: 1 })).toBe('1 recipe');
    expect(t('recipes.count', { count: 18 })).toBe('18 recipes');
    expect(t('privacy.stored.summary', { count: 0 })).toBe('Nothing is saved yet.');
    expect(t('shopping.toBuy', { count: 0 })).toBe('Nothing left to buy');
  });

  it('unknown keys fall back to the key, never to a prototype property', () => {
    expect(t('nope.nothing')).toBe('nope.nothing');
    expect(t('constructor')).toBe('constructor');
  });
});
