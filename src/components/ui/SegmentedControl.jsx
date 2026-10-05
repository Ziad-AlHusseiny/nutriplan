import { useId } from 'react';

/**
 * A row of mutually exclusive options as native radios styled as a
 * segmented pill (arrow keys move between them, as radios do).
 */
export default function SegmentedControl({ legend, name, options, value, onChange, invalid, describedBy, className = '', size = 'md', legendClassName = 'type-caption text-muted', testId }) {
  const id = useId();
  const group = name ?? id;
  return (
    <fieldset className={className} aria-invalid={invalid || undefined} aria-describedby={describedBy} data-testid={testId}>
      {legend && <legend className={`mb-2 ${legendClassName}`}>{legend}</legend>}
      <div className={`inline-flex rounded-full border p-1 ${invalid ? 'border-danger bg-danger-soft' : 'border-line bg-subtle'}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`relative inline-flex ${size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-10 px-4'} cursor-pointer items-center justify-center rounded-full font-semibold transition-colors duration-(--duration-ui) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${checked ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'}`}
            >
              <input type="radio" name={group} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" data-testid={o.testId} />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
