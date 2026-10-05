// Button styles (DESIGN-SYSTEM §5): pill, Figtree 600, 44px touch height.
// Shared by <Button> and anything that must look like one (links, labels).

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-ui) ease-(--ease-standard) active:scale-95 disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45';

const variants = {
  primary: 'bg-brand-fill text-on-brand hover:bg-brand-fill-hover shadow-card',
  secondary: 'border-[1.5px] border-brand bg-surface text-brand-ink hover:bg-brand-soft',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  danger: 'text-danger-ink hover:bg-danger-soft',
  'danger-solid': 'bg-danger text-on-danger hover:opacity-90',
};

const sizes = {
  md: 'min-h-11 px-6 text-base',
  sm: 'min-h-9 px-4 text-sm',
  icon: 'size-11 shrink-0',
  'icon-sm': 'size-9 shrink-0',
};

export function buttonClass({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}
