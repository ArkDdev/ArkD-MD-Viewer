import { useUIStore } from '@/store/uiStore';
import { useT } from '@/lib/i18n/useT';

/**
 * Confirmation modal shown when the user is about to open a file that's
 * either very large or appears to be binary. We surface this BEFORE the
 * full read so a 1 GB .iso renamed to .log doesn't lock up the editor
 * for thirty seconds before the user realises their mistake.
 *
 * State lives in uiStore: when `largeOrBinaryPrompt` is non-null, the
 * modal is open. Clicking either button resolves the underlying promise
 * (set up by files.ts) and clears the state.
 */
export function LargeOrBinaryModal() {
  const prompt = useUIStore((s) => s.largeOrBinaryPrompt);
  const resolve = useUIStore((s) => s.resolveLargeOrBinary);
  const t = useT();

  if (!prompt) return null;

  const isBinary = prompt.request.kind === 'binary';
  const title = isBinary
    ? t('largeBinary.binary.title')
    : t('largeBinary.large.title');
  const body = isBinary
    ? t('largeBinary.binary.body')
    : t('largeBinary.large.body', { size: (prompt.request as { sizeMb: string }).sizeMb });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => resolve(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-bg p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
          <WarnIcon />
          {title}
        </div>
        <p className="text-sm text-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => resolve(false)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-elevated"
          >
            {t('largeBinary.cancel')}
          </button>
          <button
            onClick={() => resolve(true)}
            autoFocus
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('largeBinary.open')}
          </button>
        </div>
      </div>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
