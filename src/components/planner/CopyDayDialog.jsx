import { useState } from 'react';
import { t } from '../../i18n/index.js';
import { DAYS } from '../../lib/week.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

const WEEKDAYS = DAYS.slice(0, 5);

/** "Copy Monday to…" (BUILD-LOG): pick days; their meals are replaced. */
export default function CopyDayDialog({ open, day, onCopy, onClose }) {
  const [picked, setPicked] = useState([]);
  const others = DAYS.filter((d) => d !== day);
  const toggle = (d) => setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  const close = () => {
    setPicked([]);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={day ? t('copy.title', { day: t(`days.${day}`) }) : ''}
      description={t('copy.intro')}
      size="sm"
      testId="copy-day-dialog"
      footer={
        <Button
          className="w-full"
          disabled={!picked.length}
          onClick={() => {
            onCopy(picked);
            setPicked([]);
          }}
          data-testid="copy-confirm"
        >
          {t('copy.action', { count: picked.length })}
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setPicked(WEEKDAYS.filter((d) => d !== day))}>
          {t('copy.weekdays')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPicked(others)}>
          {t('copy.all')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPicked([])}>
          {t('copy.none')}
        </Button>
      </div>
      <fieldset>
        <legend className="sr-only">{day ? t('copy.title', { day: t(`days.${day}`) }) : ''}</legend>
        <ul className="divide-y divide-line">
          {others.map((d) => (
            <li key={d}>
              <label className="flex min-h-12 items-center gap-3 font-medium text-ink">
                <input type="checkbox" className="size-5 accent-(--color-brand-fill)" checked={picked.includes(d)} onChange={() => toggle(d)} data-testid={`copy-to-${d}`} />
                {t(`days.${d}`)}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </Modal>
  );
}
