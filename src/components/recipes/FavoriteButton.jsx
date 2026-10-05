import { Heart } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites.js';
import { t } from '../../i18n/index.js';

/** Heart toggle (BUILD-LOG: favorites). aria-pressed carries the state. */
export default function FavoriteButton({ id, title, variant = 'overlay', className = '' }) {
  const [, isFavorite, toggle] = useFavorites();
  const on = isFavorite(id);
  const styles =
    variant === 'overlay'
      ? 'size-11 bg-surface/90 text-ink shadow-card backdrop-blur hover:bg-surface'
      : 'min-h-11 gap-2 border border-line bg-surface px-4 font-semibold text-ink hover:border-brand';
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={variant === 'overlay' ? t(on ? 'card.unsave' : 'card.save', { title }) : undefined}
      onClick={() => toggle(id)}
      className={`inline-flex items-center justify-center rounded-full transition-[background-color,border-color,transform] duration-(--duration-ui) active:scale-90 ${styles} ${className}`}
      data-testid={`favorite-${id}`}
    >
      <Heart aria-hidden="true" size={20} strokeWidth={2} className={`transition-colors ${on ? 'fill-danger text-danger' : ''}`} />
      {variant !== 'overlay' && <span>{on ? t('recipe.favorited') : t('recipe.favorite')}</span>}
    </button>
  );
}
