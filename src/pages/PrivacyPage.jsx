import { Download, HardDrive, ShieldCheck, Smartphone, Stethoscope, Trash2, Upload, WifiOff } from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';
import SafetyNotes from '../components/calculator/SafetyNotes.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useHydrated } from '../hooks/useMedia.js';
import { t } from '../i18n/index.js';
import { buildBackup, downloadFile, restoreBackup } from '../lib/backup.js';
import { promptInstall, useInstallState } from '../lib/install.js';
import { allStores, clearAll, savedKeys, storageAvailable } from '../lib/storage.js';
import '../lib/stores.js';
import { toast } from '../lib/toast.js';

/** Re-renders whenever any saved value changes (for the live summary). */
const subscribeAll = (fn) => {
  const offs = allStores().map((s) => s.subscribe(fn));
  return () => offs.forEach((off) => off());
};
const keyCount = () => savedKeys().length;

function Card({ icon: Icon, title, children, testId }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6" data-testid={testId}>
      <h2 className="flex items-center gap-3 type-heading-sm text-ink">
        <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-ink">
          <Icon aria-hidden="true" size={20} />
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-muted">{children}</div>
    </section>
  );
}

/** /privacy (BUILD-LOG): what's stored, backup and restore, delete everything, offline, not medical advice. */
export default function PrivacyPage() {
  useDocumentTitle(t('meta.pages.privacy.title'));
  const hydrated = useHydrated();
  const count = useSyncExternalStore(subscribeAll, keyCount, () => 0);
  const install = useInstallState();
  const [confirming, setConfirming] = useState(false);
  const file = useRef(null);

  async function restore(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      restoreBackup(JSON.parse(await f.text()));
      toast(t('privacy.backup.restored'));
    } catch {
      toast(t('privacy.backup.invalid'));
    }
  }

  return (
    <div className="page-x pt-8 md:pt-12">
      <header className="max-w-2xl">
        <h1 className="type-display-lg text-ink">{t('privacy.title')}</h1>
        <p className="mt-3 type-body-lg text-muted">{t('privacy.sub')}</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card icon={ShieldCheck} title={t('privacy.stored.title')} testId="privacy-stored">
          <p>{t('privacy.stored.body')}</p>
          <p className="font-semibold text-ink" aria-live="polite" data-testid="saved-count">
            {hydrated && !storageAvailable() ? t('privacy.stored.unavailable') : t('privacy.stored.summary', { count })}
          </p>
        </Card>
        <Card icon={HardDrive} title={t('privacy.backup.title')} testId="privacy-backup">
          <p>{t('privacy.backup.body')}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => downloadFile(`nutriplan-backup-${new Date().toISOString().slice(0, 10)}.json`, `${JSON.stringify(buildBackup(), null, 2)}\n`, 'application/json')}
              data-testid="download-backup"
            >
              <Download aria-hidden="true" size={18} />
              {t('privacy.backup.download')}
            </Button>
            <Button variant="secondary" onClick={() => file.current?.click()} data-testid="restore-backup">
              <Upload aria-hidden="true" size={18} />
              {t('privacy.backup.restore')}
            </Button>
            <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={restore} data-testid="restore-input" />
          </div>
        </Card>
        <Card icon={WifiOff} title={t('privacy.offline.title')} testId="privacy-offline">
          <p>{t('privacy.offline.body')}</p>
          {install === 'prompt' && (
            <Button onClick={promptInstall}>
              <Smartphone aria-hidden="true" size={18} />
              {t('privacy.offline.install')}
            </Button>
          )}
          {install === 'installed' && <p className="font-semibold text-brand-ink">{t('privacy.offline.installed')}</p>}
          {install === 'ios' && <p className="font-medium text-ink">{t('privacy.offline.ios')}</p>}
          {install === 'other' && <p className="font-medium text-ink">{t('privacy.offline.other')}</p>}
        </Card>
        <Card icon={Trash2} title={t('privacy.erase.title')} testId="privacy-erase">
          <p>{t('privacy.erase.body')}</p>
          <Button variant="danger" className="border border-danger" onClick={() => setConfirming(true)} data-testid="delete-all">
            <Trash2 aria-hidden="true" size={18} />
            {t('privacy.erase.action')}
          </Button>
        </Card>
        <div className="lg:col-span-2">
          <Card icon={Stethoscope} title={t('privacy.advice.title')} testId="privacy-advice">
            <p>{t('privacy.advice.body')}</p>
            <SafetyNotes />
          </Card>
        </div>
      </div>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('privacy.erase.confirmTitle')}
        description={t('privacy.erase.confirmBody')}
        size="sm"
        testId="delete-dialog"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger-solid"
              className="flex-[2]"
              onClick={() => {
                clearAll();
                setConfirming(false);
                toast(t('privacy.erase.done'));
              }}
              data-testid="delete-confirm"
            >
              {t('privacy.erase.confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-muted">{t('privacy.erase.body')}</p>
      </Modal>
    </div>
  );
}
