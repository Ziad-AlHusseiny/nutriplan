import { activityLevels } from '../../data/activityLevels.js';
import { t } from '../../i18n/index.js';
import Button from '../ui/Button.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';

const ERROR_KEY = { gender: 'calculator.errors.gender', required: 'calculator.errors.required', age: 'calculator.errors.age', height: 'calculator.errors.height', heightUs: 'calculator.errors.heightUs', weight: 'calculator.errors.weight', weightUs: 'calculator.errors.weightUs' };

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="type-caption text-muted">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger-ink" data-testid={`${id}-error`}>
          {t(ERROR_KEY[error])}
        </p>
      )}
    </div>
  );
}

const inputClass = (error) => `h-11 w-full rounded-md border px-3.5 pe-14 text-ink tabular ${error ? 'border-danger bg-danger-soft' : 'border-line bg-surface focus:border-brand'}`;

function NumberInput({ id, value, onChange, suffix, error, label, min, max, step = 'any' }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-label={label}
        className={inputClass(error)}
        data-testid={id}
      />
      <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden="true">
        {suffix}
      </span>
    </div>
  );
}

/**
 * Gender, age, height, weight and activity (PRD §7.2), in metric or US
 * units (BUILD-LOG). Validates on submit; the first invalid field gets focus.
 */
export default function CalculatorForm({ form, onChange, errors, system, onSystem, onSubmit }) {
  const set = (patch) => onChange({ ...form, ...patch });
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-4 shadow-card md:p-6" data-testid="calculator-form">
      <SegmentedControl
        legend={t('calculator.units')}
        value={system}
        onChange={onSystem}
        size="sm"
        options={[
          { value: 'metric', label: t('calculator.metric'), testId: 'calc-metric' },
          { value: 'us', label: t('calculator.us'), testId: 'calc-us' },
        ]}
      />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <SegmentedControl
            name="sex"
            legend={t('calculator.gender')}
            value={form.sex}
            onChange={(sex) => set({ sex })}
            invalid={Boolean(errors.sex)}
            describedBy={errors.sex ? 'sex-error' : undefined}
            options={[
              { value: 'female', label: t('calculator.female'), testId: 'sex-female' },
              { value: 'male', label: t('calculator.male'), testId: 'sex-male' },
            ]}
            testId="sex-group"
          />
          {errors.sex && (
            <p id="sex-error" className="mt-1.5 text-sm font-medium text-danger-ink" data-testid="sex-error">
              {t(ERROR_KEY[errors.sex])}
            </p>
          )}
        </div>
        <Field id="age" label={t('calculator.age')} error={errors.age}>
          <NumberInput id="age" value={form.age} onChange={(age) => set({ age })} suffix={t('calculator.years')} error={errors.age} min={15} max={90} step={1} />
        </Field>
        {system === 'us' ? (
          <div>
            <p className="type-caption text-muted" id="height-label">
              {t('calculator.height')}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <NumberInput id="ft" label={t('calculator.feet')} value={form.ft} onChange={(ft) => set({ ft })} suffix={t('calculator.ft')} error={errors.height} min={3} max={7} step={1} />
              <NumberInput id="in" label={t('calculator.inches')} value={form.in} onChange={(v) => set({ in: v })} suffix={t('calculator.in')} error={errors.height} min={0} max={11} step={1} />
            </div>
            {errors.height && (
              <p id="ft-error" className="mt-1.5 text-sm font-medium text-danger-ink" data-testid="height-error">
                <span id="in-error">{t(ERROR_KEY[errors.height])}</span>
              </p>
            )}
          </div>
        ) : (
          <Field id="heightCm" label={t('calculator.height')} error={errors.height}>
            <NumberInput id="heightCm" value={form.heightCm} onChange={(heightCm) => set({ heightCm })} suffix={t('calculator.cm')} error={errors.height} min={120} max={230} />
          </Field>
        )}
        {system === 'us' ? (
          <Field id="lb" label={t('calculator.weight')} error={errors.weight}>
            <NumberInput id="lb" value={form.lb} onChange={(lb) => set({ lb })} suffix={t('calculator.lb')} error={errors.weight} min={78} max={551} />
          </Field>
        ) : (
          <Field id="weightKg" label={t('calculator.weight')} error={errors.weight}>
            <NumberInput id="weightKg" value={form.weightKg} onChange={(weightKg) => set({ weightKg })} suffix={t('calculator.kg')} error={errors.weight} min={35} max={250} />
          </Field>
        )}
        <div className="md:col-span-2">
          <Field id="activity" label={t('calculator.activity')} error={errors.activity}>
            <select
              id="activity"
              value={form.activity}
              onChange={(e) => set({ activity: e.target.value })}
              aria-invalid={errors.activity ? true : undefined}
              aria-describedby={errors.activity ? 'activity-error' : undefined}
              className={`${inputClass(errors.activity)} pe-3.5`}
              data-testid="activity"
            >
              <option value="">{t('calculator.activityPlaceholder')}</option>
              {activityLevels.map((a) => (
                <option key={a.id} value={a.id}>
                  {t(`calculator.activities.${a.id}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Button type="submit" className="mt-6 w-full md:w-auto" data-testid="calculate">
        {t('calculator.calculate')}
      </Button>
    </form>
  );
}
