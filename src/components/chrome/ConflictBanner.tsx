interface ConflictBannerProps {
  show: boolean;
  onReload: () => void;
  onKeep: () => void;
}

export function ConflictBanner({ show, onReload, onKeep }: ConflictBannerProps) {
  if (!show) return null;

  return (
    <div className="border-b border-border bg-accent/8 px-4 py-2.5"
      style={{ backgroundColor: 'rgb(var(--accent) / 0.08)' }}
    >
      <div className="flex items-center gap-3 text-sm">
        <WarnIcon />
        <span className="flex-1 text-text">
          Файл изменён извне. Загрузить новую версию или оставить ваши изменения?
        </span>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onReload}
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Загрузить
          </button>
          <button
            onClick={onKeep}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-text transition-colors hover:bg-surface"
          >
            Оставить мои
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-accent"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
