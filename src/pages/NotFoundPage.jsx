import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { t } from '../i18n/index.js';

/** Unknown paths redirect to / (PRD §1 `*` route). */
export default function NotFoundPage() {
  useDocumentTitle(t('meta.pages.notFound.title'));
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);
  return (
    <div className="page-x py-24 text-center">
      <h1 className="type-display-lg text-ink">{t('notFound.title')}</h1>
      <p className="mt-3 text-muted">{t('notFound.body')}</p>
      <Button to="/" className="mt-8">
        {t('notFound.action')}
      </Button>
    </div>
  );
}
