import { X } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { t } from '../../i18n/index.js';
import { dismissToast, getToast, subscribeToast } from '../../lib/toast.js';

/** Bottom-center, above the mobile tab bar; announced politely. */
export default function Toaster() {
  const item = useSyncExternalStore(subscribeToast, getToast, () => null);

  useEffect(() => {
    if (!item) return undefined;
    const timer = setTimeout(() => {
      if (getToast()?.id === item.id) dismissToast();
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6" data-print="hide">
      <div role="status" aria-live="polite" className="contents">
        {item && (
          <div key={item.id} className="pop-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-ink py-2 ps-4 pe-2 text-page shadow-modal" data-testid="toast">
            <p className="py-1.5 text-sm font-medium">{item.message}</p>
            {item.action && (
              <button
                type="button"
                className="min-h-9 shrink-0 rounded-full px-3 text-sm font-bold text-brand-soft underline-offset-4 hover:underline"
                onClick={() => {
                  item.action.onClick();
                  dismissToast();
                }}
              >
                {item.action.label}
              </button>
            )}
            <button type="button" onClick={dismissToast} className="grid size-9 shrink-0 place-items-center rounded-full opacity-80 hover:opacity-100" aria-label={t('a11y.close')}>
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
