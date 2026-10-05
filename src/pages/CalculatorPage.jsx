import { useState } from 'react';
import CalculatorForm from '../components/calculator/CalculatorForm.jsx';
import ResultsPanel from '../components/calculator/ResultsPanel.jsx';
import SafetyNotes from '../components/calculator/SafetyNotes.jsx';
import { activityById } from '../data/activityLevels.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useHydrated } from '../hooks/useMedia.js';
import { useStored } from '../hooks/useStored.js';
import { t } from '../i18n/index.js';
import { bmr, dailyTarget, macroTargets, PROTEIN_PER_KG, tdee } from '../lib/calculations.js';
import { validateCalculator } from '../lib/calculatorForm.js';
import { ftInFromCm, lbFromKg } from '../lib/units.js';
import { macrosStore, profileStore, targetStore, unitsStore } from '../lib/stores.js';

const EMPTY = { sex: '', age: '', heightCm: '', weightKg: '', ft: '', in: '', lb: '', activity: '' };

/** The last saved inputs, as form values in both unit systems. */
function formFrom(profile) {
  if (!profile) return EMPTY;
  const { ft, in: inches } = profile.heightCm ? ftInFromCm(profile.heightCm) : { ft: '', in: '' };
  return {
    sex: profile.sex ?? '',
    age: profile.age != null ? String(profile.age) : '',
    heightCm: profile.heightCm != null ? String(Math.round(profile.heightCm)) : '',
    weightKg: profile.weightKg != null ? String(Math.round(profile.weightKg * 10) / 10) : '',
    ft: profile.heightCm ? String(ft) : '',
    in: profile.heightCm ? String(inches) : '',
    lb: profile.weightKg != null ? String(Math.round(lbFromKg(profile.weightKg))) : '',
    activity: profile.activity ?? '',
  };
}

/** /calculator (PRD §7): form → results with goals → save the target to the planner. */
export default function CalculatorPage() {
  useDocumentTitle(t('meta.pages.calculator.title'));
  const hydrated = useHydrated();
  const [profile] = useStored(profileStore);
  const [system, setSystem] = useStored(unitsStore);
  const [form, setForm] = useState(EMPTY);
  const [seeded, setSeeded] = useState(false);
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);
  const [goal, setGoal] = useState('maintain');
  const [saved, setSaved] = useState(null);
  const [stale, setStale] = useState(false);

  // Fill in last time's numbers once they're readable (after hydration).
  if (hydrated && !seeded) {
    setSeeded(true);
    if (profile) {
      setForm(formFrom(profile));
      if (profile.goal) setGoal(profile.goal);
    }
  }

  function calculate(e) {
    e.preventDefault();
    const { profile: p, errors: errs } = validateCalculator(form, system);
    setErrors(errs);
    if (!p) {
      const order = ['sex', 'age', 'height', 'weight', 'activity'];
      const first = order.find((k) => errs[k]);
      const target = { sex: 'input[name="sex"]', age: '#age', height: system === 'us' ? '#ft' : '#heightCm', weight: system === 'us' ? '#lb' : '#weightKg', activity: '#activity' }[first];
      document.querySelector(target)?.focus();
      return;
    }
    const multiplier = activityById(p.activity).multiplier;
    setResults({ profile: p, bmr: bmr(p), tdee: tdee(p, multiplier) });
    setSaved(null);
    setStale(false);
    profileStore.set({ ...p, goal });
  }

  const target = results ? dailyTarget({ tdee: results.tdee, bmr: results.bmr, sex: results.profile.sex, age: results.profile.age }, goal) : null;
  const effectiveGoal = target?.minor && (goal === 'lose' || goal === 'lose-slow') ? 'maintain' : goal;
  const macros = results ? { ...macroTargets(target.target, { weightKg: results.profile.weightKg, goal: effectiveGoal }), perKg: PROTEIN_PER_KG[effectiveGoal] } : null;

  function save() {
    targetStore.set(target.target);
    macrosStore.set({ protein: macros.protein, carbs: macros.carbs, fat: macros.fat });
    profileStore.set({ ...results.profile, goal });
    setSaved(target.target);
  }

  return (
    <div className="page-x pt-8 md:pt-12">
      <header className="max-w-2xl">
        <h1 className="type-display-lg text-ink">{t('calculator.title')}</h1>
        <p className="mt-3 type-body-lg text-muted">{t('calculator.sub')}</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-7">
          <CalculatorForm
            form={form}
            onChange={(next) => {
              setForm(next);
              if (results) setStale(true);
            }}
            errors={errors}
            system={system}
            onSystem={(next) => {
              setSystem(next);
              setErrors({});
            }}
            onSubmit={calculate}
          />
          <SafetyNotes />
        </div>
        <aside className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start" aria-label={t('calculator.target')}>
          <ResultsPanel
            results={results}
            goal={effectiveGoal}
            onGoal={(g) => {
              setGoal(g);
              setSaved(null);
            }}
            target={target}
            macros={macros}
            onSave={save}
            saved={saved}
            stale={stale}
          />
        </aside>
      </div>
    </div>
  );
}
