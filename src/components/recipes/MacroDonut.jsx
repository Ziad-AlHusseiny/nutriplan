import { t } from '../../i18n/index.js';
import { macroShares, MACROS } from '../../lib/calculations.js';
import { formatNumber, percent } from '../../lib/format.js';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';

const COLORS = { protein: 'var(--color-protein)', carbs: 'var(--color-carbs)', fat: 'var(--color-fat)' };

/**
 * Hand-drawn SVG donut (DECISIONS D7): three arcs sized by each macro's
 * share of the calories, normalized so they meet exactly. Each arc is a
 * circle rotated to its start, revealed by stroke-dashoffset (900ms).
 */
export default function MacroDonut({ recipe, size = 208, stroke = 24, phase = 'final' }) {
  const { segments, ofKcal } = macroShares(recipe);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Each arc starts where the previous one ended.
  const arcs = MACROS.map((m, i) => {
    const before = MACROS.slice(0, i).reduce((sum, prev) => sum + segments[prev], 0);
    return { m, len: segments[m] * c, rotate: -90 + before * 360 };
  });
  const label = t('recipe.donutLabel', {
    kcal: formatNumber(recipe.kcal),
    protein: percent(ofKcal.protein),
    carbs: percent(ofKcal.carbs),
    fat: percent(ofKcal.fat),
  });
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label} data-testid="macro-donut">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={a.m}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLORS[a.m]}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${c}`}
            strokeDashoffset={phase === 'armed' ? a.len : 0}
            transform={`rotate(${a.rotate} ${size / 2} ${size / 2})`}
            style={{ transition: phase === 'play' ? `stroke-dashoffset 900ms var(--ease-standard) ${i * 120}ms` : 'none' }}
            data-share={segments[a.m].toFixed(4)}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center" aria-hidden="true">
        <AnimatedNumber value={phase === 'armed' ? 0 : recipe.kcal} instant={phase !== 'play'} className="type-stat block text-ink" data-testid="donut-kcal" />
        <span className="mt-1 text-xs font-semibold text-muted">{t('recipe.kcalCaption')}</span>
      </div>
    </div>
  );
}
