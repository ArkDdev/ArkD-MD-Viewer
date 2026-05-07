import { useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';

interface ConflictModalProps {
  show: boolean;
  filePath: string | null;
  onReload: () => void;
  onKeep: () => void;
}

export function ConflictModal({ show, filePath, onReload, onKeep }: ConflictModalProps) {
  const t = useT();

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onKeep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onKeep]);

  if (!show) return null;

  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? filePath : t('file.untitled');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-elevated shadow-elevated">
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <WarnIcon />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-sm font-semibold text-text">
              {t('conflict.title')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {t('conflict.description.prefix')}{' '}
              <span className="font-medium text-text">{fileName}</span>{' '}
              {t('conflict.description.suffix')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t('conflict.question')}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border bg-surface/40 px-5 py-3">
          <button
            onClick={onReload}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500"
          >
            {t('conflict.reload')}
          </button>
          <button
            onClick={onKeep}
            autoFocus
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('conflict.keep')}
          </button>
        </div>
      </div>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
