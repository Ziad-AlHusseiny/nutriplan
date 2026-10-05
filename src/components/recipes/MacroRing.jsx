import { t } from '../../i18n/index.js';
import { formatNumber, percent } from '../../lib/format.js';

/**
 * One progress ring (PRD §5.5): fills to the macro's share of the
 * recipe's calories, grams in the middle, label and "% of calories" below.
 */
export default function MacroRing({ macro, grams, fraction, color, size = 92, stroke = 9, phase = 'final', delay = 0 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = percent(fraction);
  const offset = phase === 'armed' ? c : c * (1 - Math.min(1, fraction));
  return (
    <figure className="flex flex-col items-center text-center" data-testid={`ring-${macro}`} data-percent={pct}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={t('recipe.ringLabel', { macro: t(`macros.${macro}`), grams: formatNumber(grams), percent: pct })}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: phase === 'play' ? `stroke-dashoffset 900ms var(--ease-standard) ${delay}ms` : 'none' }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold text-ink tabular" aria-hidden="true">
          {t('common.grams', { value: formatNumber(grams) })}
        </span>
      </div>
      <figcaption className="mt-2">
        <span className="block font-semibold text-ink">{t(`macros.${macro}`)}</span>
        <span className="block text-sm text-muted">{t('recipe.ofCalories', { value: pct })}</span>
      </figcaption>
    </figure>
  );
}
