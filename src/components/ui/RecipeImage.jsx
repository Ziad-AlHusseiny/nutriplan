import { imageFor } from '../../data/images.js';

/**
 * A food photo as <picture>: AVIF, then WebP, at the widths `sizes` needs.
 * Lazy and low-priority unless `priority` (the LCP image). Explicit width and
 * height (4:3) so nothing shifts while it loads (BRIEF criterion 3).
 */
export default function RecipeImage({ id, alt, sizes, className = '', imgClassName = '', priority = false, max, min, ...rest }) {
  const img = imageFor(id, { max, min });
  if (!img) return <div className={`bg-subtle ${className} ${imgClassName}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} {...rest} />;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.src}
        alt={alt}
        width={img.width}
        height={img.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={`block size-full bg-subtle object-cover ${imgClassName}`}
        {...rest}
      />
    </picture>
  );
}
