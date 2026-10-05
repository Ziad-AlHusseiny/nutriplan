import { defaultMacroTargets } from '../lib/calculations.js';
import { macrosStore, targetStore } from '../lib/stores.js';
import { useStored } from './useStored.js';

/** Daily targets: kcal (`nutriplan-target`) and macros (`nutriplan-macros`, or 20/50/30 of kcal). */
export function useTargets() {
  const [kcal] = useStored(targetStore);
  const [macros] = useStored(macrosStore);
  return { kcal, ...(macros ?? defaultMacroTargets(kcal)), custom: Boolean(macros) };
}
