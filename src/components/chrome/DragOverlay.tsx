import type { DragDropState } from '@/lib/fs/dragDrop';

interface DragOverlayProps {
  state: DragDropState;
}

export function DragOverlay({ state }: DragOverlayProps) {
  if (!state.isDragOver) return null;

  const { hasSupportedFile, message } = state;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
      style={{
        backgroundColor: hasSupportedFile
          ? 'rgb(var(--accent) / 0.06)'
          : 'rgb(var(--muted) / 0.06)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-10 py-8 ${
          hasSupportedFile
            ? 'border-accent/60 bg-elevated/95'
            : 'border-muted/40 bg-elevated/95'
        }`}
        style={{ minWidth: 280 }}
      >
        <div className={hasSupportedFile ? 'text-accent' : 'text-muted'}>
          {hasSupportedFile ? <DownloadIcon /> : <ProhibitIcon />}
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-text">{message}</div>
          {!hasSupportedFile && (
            <div className="mt-1 text-xs text-subtle">
              Перетащите файл с расширением .md или .markdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ProhibitIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
