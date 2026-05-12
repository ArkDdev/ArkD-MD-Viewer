import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { useT } from '@/lib/i18n/useT';
import {
  requestElevatedRestart,
  applyHydrationState,
  clearElevationStateFile,
  type ElevationStateSnapshot,
} from '@/lib/elevation/elevation';

/**
 * Three modals that drive the UAC elevation flow. They share a common
 * visual style (modal scrim + centred panel) but have different content
 * and button sets — kept together in one file because they form a
 * conceptual unit and never coexist on screen.
 *
 *   ElevationPromptModal    — "Restart as admin?" (Windows write-protected save)
 *   ElevationUnsupportedModal — "Re-launch manually" (macOS/Linux, no UAC)
 *   ElevationRecoveryModal  — "Restore unsaved work?" (orphan state on startup)
 */

function ModalShell({
  children,
  onBackdropClick,
}: {
  children: React.ReactNode;
  onBackdropClick?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-bg p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/* ─── ElevationPromptModal ──────────────────────────────────────────── */

export function ElevationPromptModal() {
  const isOpen = useUIStore((s) => s.isElevationPromptOpen);
  const close = useUIStore((s) => s.closeElevationPrompt);
  const filePath = useFileStore((s) => s.filePath);
  const t = useT();
  const [busy, setBusy] = useState(false);

  // Reset busy flag whenever the modal opens — covers the case where a
  // previous attempt errored and the user re-opens it for another try.
  useEffect(() => {
    if (isOpen) setBusy(false);
  }, [isOpen]);

  const fileName = filePath ? filePath.split(/[/\\]/).pop() : null;

  const handleRestart = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const err = await requestElevatedRestart();
    if (err) {
      // Should not happen on Windows in normal cases; if it does, fall
      // through to the unsupported modal so the user gets at least some
      // guidance.
      console.warn('Elevation request failed:', err);
      useUIStore.getState().closeElevationPrompt();
      useUIStore.getState().openElevationUnsupported();
      setBusy(false);
    }
    // On success: the process exits inside requestElevatedRestart, so we
    // never get here. Leave busy=true intentionally — disables buttons
    // while the exit is in flight (~150ms).
  }, [busy]);

  if (!isOpen) return null;

  return (
    <ModalShell onBackdropClick={busy ? undefined : close}>
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
        <ShieldIcon />
        {t('elevation.required.title')}
      </div>
      <p className="text-sm text-muted">
        {fileName
          ? t('elevation.required.body', { name: fileName })
          : t('elevation.required.bodyUnnamed')}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={close}
          disabled={busy}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-elevated disabled:opacity-50"
        >
          {t('elevation.required.cancel')}
        </button>
        <button
          onClick={handleRestart}
          disabled={busy}
          autoFocus
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {t('elevation.required.restart')}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── ElevationUnsupportedModal (macOS/Linux) ──────────────────────── */

export function ElevationUnsupportedModal() {
  const isOpen = useUIStore((s) => s.isElevationUnsupportedOpen);
  const close = useUIStore((s) => s.closeElevationUnsupported);
  const t = useT();

  if (!isOpen) return null;

  return (
    <ModalShell onBackdropClick={close}>
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
        <ShieldIcon />
        {t('elevation.unsupported.title')}
      </div>
      <p className="text-sm text-muted">{t('elevation.unsupported.body')}</p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={close}
          autoFocus
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {t('elevation.unsupported.ok')}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── ElevationRecoveryModal ────────────────────────────────────────── */

interface RecoveryModalProps {
  snapshot: ElevationStateSnapshot;
}

export function ElevationRecoveryModal({ snapshot }: RecoveryModalProps) {
  const isOpen = useUIStore((s) => s.isElevationRecoveryOpen);
  const close = useUIStore((s) => s.closeElevationRecovery);
  const t = useT();

  const fileName = snapshot.filePath
    ? snapshot.filePath.split(/[/\\]/).pop()
    : null;

  const handleRestore = useCallback(() => {
    applyHydrationState(snapshot);
    clearElevationStateFile();
    close();
  }, [snapshot, close]);

  const handleDiscard = useCallback(() => {
    clearElevationStateFile();
    close();
  }, [close]);

  if (!isOpen) return null;

  return (
    <ModalShell>
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
        <ShieldIcon />
        {t('elevation.recovery.title')}
      </div>
      <p className="text-sm text-muted">
        {fileName
          ? t('elevation.recovery.body', { name: fileName })
          : t('elevation.recovery.bodyUnnamed')}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={handleDiscard}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-elevated"
        >
          {t('elevation.recovery.discard')}
        </button>
        <button
          onClick={handleRestore}
          autoFocus
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {t('elevation.recovery.restore')}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Icon ─────────────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
