import { t } from '../i18n/index.js';

/** 900 → "15 min", 90 → "1 min 30 s", 30 → "30 s". */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return t('duration.sec', { count: s });
  if (!s) return t('duration.min', { count: m });
  return t('duration.minSec', { m, s });
}
