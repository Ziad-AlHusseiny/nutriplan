const tones = {
  orange: 'bg-accent-soft text-accent-ink',
  green: 'bg-brand-soft text-brand-ink',
  neutral: 'bg-subtle text-muted',
};

/** Pill metadata label: kcal (orange), time (green), servings / cuisine (neutral). */
export default function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm leading-5 font-semibold tabular ${tones[tone]} ${className}`}>
      {Icon && <Icon aria-hidden="true" size={14} strokeWidth={2.25} />}
      {children}
    </span>
  );
}
