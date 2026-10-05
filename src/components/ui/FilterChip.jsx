import { Check } from 'lucide-react';

/** Toggleable filter pill with aria-pressed (PRD §4.2, §8.3). */
export default function FilterChip({ label, selected, onToggle, tone = 'green', icon: Icon, className = '', ...props }) {
  const on = tone === 'orange' ? 'bg-accent-fill text-on-accent border-accent-fill' : 'bg-brand-fill text-on-brand border-brand-fill';
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm leading-5 font-medium transition-[background-color,color,border-color,transform] duration-(--duration-ui) ease-(--ease-standard) active:scale-95 sm:min-h-9 ${selected ? on : 'border-line bg-surface text-ink hover:border-brand'} ${className}`}
      {...props}
    >
      {selected ? <Check aria-hidden="true" size={14} strokeWidth={2.5} /> : Icon && <Icon aria-hidden="true" size={14} strokeWidth={2.25} />}
      {label}
    </button>
  );
}
