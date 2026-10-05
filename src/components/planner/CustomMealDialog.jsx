import { useId, useState } from 'react';
import { t } from '../../i18n/index.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

const FIELDS = ['kcal', 'protein', 'carbs', 'fat'];

function NumberField({ id, label, value, onChange, error, optional, testId }) {
  const errId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="type-caption text-muted">
        {label}
        {optional && <span className="ms-1 normal-case tracking-normal">({t('meal.optional')})</span>}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`mt-1.5 h-11 w-full rounded-md border px-3.5 text-ink tabular ${error ? 'border-danger bg-danger-soft' : 'border-line bg-surface focus:border-brand'}`}
        data-testid={testId}
      />
      {error && (
        <p id={errId} className="mt-1 text-sm text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Your own meal (BUILD-LOG): name and calories (macros optional), per
 * serving. Saved in `nutriplan-meals`; planned like any recipe.
 */
export default function CustomMealDialog({ open, meal, onSave, onDelete, onClose, returnFocus }) {
  const id = useId();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  // A fresh form every time it opens (after a delete it stays mounted).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(null);
      setErrors({});
    }
  }
  const values = form ?? {
    name: meal?.name ?? '',
    kcal: meal?.kcal ?? '',
    protein: meal?.protein ?? '',
    carbs: meal?.carbs ?? '',
    fat: meal?.fat ?? '',
  };
  const set = (patch) => setForm({ ...values, ...patch });

  function close() {
    setForm(null);
    setErrors({});
    onClose();
  }

  function submit(e) {
    e.preventDefault();
    const next = {};
    const name = String(values.name).trim();
    if (!name) next.name = t('meal.nameError');
    const kcal = Number(values.kcal);
    if (values.kcal === '' || !(kcal >= 1 && kcal <= 5000)) next.kcal = t('meal.kcalError');
    for (const f of ['protein', 'carbs', 'fat']) {
      if (values[f] === '') continue;
      const n = Number(values[f]);
      if (!(n >= 0 && n <= 1000)) next[f] = t('meal.gramsError');
    }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${id}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    const grams = (v) => (v === '' ? null : Math.round(Number(v)));
    onSave({ id: meal?.id ?? Math.random().toString(36).slice(2, 10), name: name.slice(0, 80), kcal: Math.round(kcal), protein: grams(values.protein), carbs: grams(values.carbs), fat: grams(values.fat) });
    setForm(null);
  }

  return (
    <Modal open={open} onClose={close} title={meal ? t('meal.editTitle') : t('meal.title')} description={t('meal.intro')} returnFocus={returnFocus} testId="custom-meal">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className="type-caption text-muted">
            {t('meal.name')}
          </label>
          <input
            id={`${id}-name`}
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t('meal.namePlaceholder')}
            maxLength={80}
            data-autofocus
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            className={`mt-1.5 h-11 w-full rounded-md border px-3.5 text-ink placeholder:text-muted/70 ${errors.name ? 'border-danger bg-danger-soft' : 'border-line bg-surface focus:border-brand'}`}
            data-testid="meal-name"
          />
          {errors.name && (
            <p id={`${id}-name-error`} className="mt-1 text-sm text-danger-ink">
              {errors.name}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <NumberField key={f} id={`${id}-${f}`} label={t(`meal.${f}`)} value={values[f]} onChange={(v) => set({ [f]: v })} error={errors[f]} optional={f !== 'kcal'} testId={`meal-${f}`} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" data-testid="meal-save">
            {meal ? t('meal.save') : t('meal.saveAndAdd')}
          </Button>
          {meal && onDelete && (
            <Button variant="danger" onClick={() => onDelete(meal)} className="ms-auto">
              {t('meal.delete')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
