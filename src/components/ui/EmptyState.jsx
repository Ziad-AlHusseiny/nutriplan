import Button from './Button.jsx';

/** Icon + title + body + optional action (no results, empty week, not found). */
export default function EmptyState({ icon: Icon, title, body, actionLabel, onAction, actionTo, actionVariant = 'secondary', className = '', titleAs: Title = 'h2', children }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border border-line bg-surface px-6 py-10 text-center shadow-card ${className}`}>
      {Icon && (
        <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand-ink">
          <Icon aria-hidden="true" size={26} strokeWidth={2} />
        </span>
      )}
      <Title className="mt-4 type-heading-sm text-ink">{title}</Title>
      {body && <p className="mt-2 max-w-md text-muted">{body}</p>}
      {children}
      {actionLabel && (
        <Button variant={actionVariant} className="mt-6" to={actionTo} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
