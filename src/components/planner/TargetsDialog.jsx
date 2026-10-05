import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/index.js';
import { defaultMacroTargets } from '../../lib/calculations.js';
import { MACRO_MAX, macrosStore, TARGET_INPUT, targetStore } from '../../lib/stores.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

/** Type in the targets you already follow (or let the 20/50/30 split decide the macros). */
export default function TargetsDialog({ open, targets, onClose }) {
  const id = useId();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const values = form ?? { kcal: targets.kcal, protein: targets.protein, carbs: targets.carbs, fat: targets.fat, auto: !targets.custom };
  const set = (patch) => setForm({ ...values, ...patch });
  const auto = values.auto;
  const preview = auto ? defaultMacroTargets(Number(values.kcal) || 0) : null;

  function close() {
    setForm(null);
    setErrors({});
    onClose();
  }
  function save(e) {
    e.preventDefault();
    const next = {};
    const kcal = Number(values.kcal);
    if (!(kcal >= TARGET_INPUT[0] && kcal <= TARGET_INPUT[1])) next.kcal = t('targets.kcalError');
    if (!auto) for (const m of ['protein', 'carbs', 'fat']) if (!(Number(values[m]) >= 0 && Number(values[m]) <= MACRO_MAX[m]) || values[m] === '') next[m] = t('targets.gramsError', { max: MACRO_MAX[m] });
    setErrors(next);
    if (Object.keys(next).length) return;
    targetStore.set(Math.round(kcal));
    macrosStore.set(auto ? null : { protein: Number(values.protein), carbs: Number(values.carbs), fat: Number(values.fat) });
    close();
  }

  const field = (key, unit) => (
    <div key={key}>
      <label htmlFor={`${id}-${key}`} className="type-caption text-muted">
        {t(`targets.${key}`)} ({unit})
      </label>
      <input
        id={`${id}-${key}`}
        type="number"
        inputMode="numeric"
        value={key !== 'kcal' && auto ? preview[key] : values[key]}
        disabled={key !== 'kcal' && auto}
        onChange={(e) => set({ [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id}-${key}-err` : undefined}
        className={`mt-1.5 h-11 w-full rounded-md border px-3.5 text-ink tabular disabled:bg-subtle disabled:text-muted ${errors[key] ? 'border-danger bg-danger-soft' : 'border-line bg-surface focus:border-brand'}`}
        data-testid={`target-${key}`}
      />
      {errors[key] && (
        <p id={`${id}-${key}-err`} className="mt-1 text-sm text-danger-ink">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={close} title={t('targets.title')} description={t('targets.intro')} size="sm" testId="targets-dialog">
      <form onSubmit={save} noValidate className="space-y-4">
        {field('kcal', t('units.kcal'))}
        <label className="flex items-start gap-3 text-sm font-medium text-ink">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-(--color-brand-fill)" checked={auto} onChange={(e) => set({ auto: e.target.checked })} />
          {t('targets.auto')}
        </label>
        <div className="grid grid-cols-3 gap-3">{['protein', 'carbs', 'fat'].map((m) => field(m, t('units.g')))}</div>
        <p className="text-sm text-muted">
          <Link to="/calculator" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
            {t('targets.calculator')}
          </Link>
        </p>
        <Button type="submit" className="w-full" data-testid="targets-save">
          {t('targets.save')}
        </Button>
      </form>
    </Modal>
  );
}
