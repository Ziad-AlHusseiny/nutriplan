// The calculator form's validation (PRD §7.2), in metric or US units.
// Returns { profile, errors }: profile in metric (kg, cm) when valid.

import { cmFromFtIn, kgFromLb } from './units.js';

export const RANGES = { age: [15, 90], heightCm: [120, 230], weightKg: [35, 250] };

const number = (v) => (v === '' || v == null ? null : Number(v));

export function validateCalculator(form, system = 'metric') {
  const errors = {};
  if (!form.sex) errors.sex = 'gender';
  const age = number(form.age);
  if (age == null) errors.age = 'required';
  else if (!(age >= RANGES.age[0] && age <= RANGES.age[1])) errors.age = 'age';

  let heightCm = null;
  if (system === 'us') {
    const ft = number(form.ft);
    const inches = number(form.in) ?? 0;
    if (ft == null) errors.height = 'required';
    else {
      heightCm = cmFromFtIn(ft, inches);
      if (!(heightCm >= RANGES.heightCm[0] - 0.5 && heightCm <= RANGES.heightCm[1] + 0.5) || inches < 0 || inches >= 12) errors.height = 'heightUs';
    }
  } else {
    heightCm = number(form.heightCm);
    if (heightCm == null) errors.height = 'required';
    else if (!(heightCm >= RANGES.heightCm[0] && heightCm <= RANGES.heightCm[1])) errors.height = 'height';
  }

  let weightKg = null;
  if (system === 'us') {
    const lb = number(form.lb);
    if (lb == null) errors.weight = 'required';
    else {
      weightKg = kgFromLb(lb);
      if (!(weightKg >= RANGES.weightKg[0] - 0.3 && weightKg <= RANGES.weightKg[1] + 0.3)) errors.weight = 'weightUs';
    }
  } else {
    weightKg = number(form.weightKg);
    if (weightKg == null) errors.weight = 'required';
    else if (!(weightKg >= RANGES.weightKg[0] && weightKg <= RANGES.weightKg[1])) errors.weight = 'weight';
  }

  if (!form.activity) errors.activity = 'required';
  if (Object.keys(errors).length) return { errors, profile: null };
  return { errors, profile: { sex: form.sex, age, heightCm, weightKg, activity: form.activity } };
}
