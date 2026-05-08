import { useEffect } from 'react';
import { useFileStore } from '@/store/fileStore';
import { useT } from '@/lib/i18n/useT';
import { useGuardModal } from '@/lib/unsavedGuard';

/**
 * Three-button modal shown before any destructive action when the buffer
 * is dirty. Renders nothing until `useGuardModal()` returns a resolver.
 *
 * Keys:
 *   Escape → 'cancel'  (safe default — match the kept-changes side of any
 *                        VS Code-style "save?" prompt)
 *   Enter  → 'save'    (the autoFocus'd primary action)
 */
export function UnsavedChangesModal() {
  const resolver = useGuardModal();
  const filePath = useFileStore((s) => s.filePath);
  const t = useT();

  useEffect(() => {
    if (!resolver) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resolver('cancel');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resolver]);

  if (!resolver) return null;

  const fileName = filePath ? filePath.split(/[/\\]/).pop() : null;
  const description = fileName
    ? t('unsaved.description.named', { name: fileName })
    : t('unsaved.description.unnamed');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-elevated shadow-elevated">
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <DocIcon />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-sm font-semibold text-text">
              {t('unsaved.title')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border bg-surface/40 px-5 py-3">
          <button
            onClick={() => resolver('cancel')}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-text"
          >
            {t('unsaved.cancel')}
          </button>
          <button
            onClick={() => resolver('discard')}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500"
          >
            {t('unsaved.discard')}
          </button>
          <button
            onClick={() => resolver('save')}
            autoFocus
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('unsaved.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}
