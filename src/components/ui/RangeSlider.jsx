import { useId } from 'react';
import { t } from '../../i18n/index.js';

/** Labeled native range input with a live readout ("Any" at max) (PRD §4.2). */
export default function RangeSlider({ label, min, max, step, value, format, onChange, className = '', testId }) {
  const id = useId();
  const readout = value >= max ? t('common.any') : format(value);
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="type-caption text-muted">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold text-ink tabular" data-testid={testId ? `${testId}-value` : undefined}>
          {readout}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={readout}
        style={{ '--fill': `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
      />
    </div>
  );
}
