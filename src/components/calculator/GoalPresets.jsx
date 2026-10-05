import { t } from '../../i18n/index.js';
import { GOALS } from '../../lib/calculations.js';
import FilterChip from '../ui/FilterChip.jsx';

/** Goal chips (PRD §7.3, plus a gentler cut): selected in orange. Weight loss is unavailable under 18. */
export default function GoalPresets({ value, onChange, minor }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-labelledby="goal-title">
      {GOALS.map((g) => (
        <FilterChip key={g.id} tone="orange" label={t(`calculator.goals.${g.id}`)} selected={value === g.id} disabled={minor && g.adjust < 0} onToggle={() => onChange(g.id)} className="disabled:cursor-not-allowed disabled:opacity-45" data-testid={`goal-${g.id}`} />
      ))}
    </div>
  );
}
