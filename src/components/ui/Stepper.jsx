import { Minus, Plus } from 'lucide-react';
import { formatServings } from '../../lib/format.js';

/** − value + with clamped bounds; buttons disable at the ends (PRD §5.3). */
export default function Stepper({ value, min, max, step = 1, onChange, decreaseLabel, increaseLabel, label, size = 'md', testId, format = formatServings }) {
  const btn = size === 'sm' ? 'size-9' : 'size-11';
  const cls = `grid ${btn} place-items-center rounded-full border border-line bg-surface text-ink transition-[background-color,transform,border-color] duration-(--duration-tap) hover:border-brand active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100`;
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label} data-testid={testId}>
      <button type="button" className={cls} onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={decreaseLabel}>
        <Minus aria-hidden="true" size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />
      </button>
      <output className={`${size === 'sm' ? 'min-w-9 text-base' : 'min-w-10 text-lg'} text-center font-display font-bold tabular`} aria-live="polite" data-testid={testId ? `${testId}-value` : undefined}>
        {format(value)}
      </output>
      <button type="button" className={cls} onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={increaseLabel}>
        <Plus aria-hidden="true" size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
