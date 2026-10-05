// Activity levels (TECHNICAL-PLAN §4.2). Labels live in the dictionaries
// (calculator.activities.<id>) so they read naturally in both languages.
export const activityLevels = [
  { id: 'sedentary', multiplier: 1.2 },
  { id: 'light', multiplier: 1.375 },
  { id: 'moderate', multiplier: 1.55 },
  { id: 'very', multiplier: 1.725 },
  { id: 'athlete', multiplier: 1.9 },
];
export const activityById = (id) => activityLevels.find((a) => a.id === id) ?? null;
