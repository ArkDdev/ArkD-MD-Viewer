import { useUIStore, type ViewMode } from '@/store/uiStore';
import { pickAndOpenFile } from '@/lib/fs/files';
import { useFileStore } from '@/store/fileStore';
import { IconButton } from '@/components/ui/IconButton';

export function Toolbar() {
  const { mode, setMode, theme, setTheme } = useUIStore();
  const loadFile = useFileStore((s) => s.loadFile);

  const handleOpen = async () => {
    const file = await pickAndOpenFile();
    if (file) loadFile(file.path, file.content);
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-bg px-3">
      <IconButton onClick={handleOpen} tooltip="Open (⌘O)" label="Open">
        <FolderIcon />
      </IconButton>

      <div className="mx-2 h-5 w-px bg-border" />

      <ModeButton current={mode} value="view" onSelect={setMode} label="View" />
      <ModeButton current={mode} value="edit" onSelect={setMode} label="Edit" />
      <ModeButton current={mode} value="split" onSelect={setMode} label="Split" />

      <div className="flex-1" />

      <IconButton onClick={cycleTheme} tooltip={`Theme: ${theme}`} label="Theme">
        {theme === 'dark' ? <MoonIcon /> : theme === 'light' ? <SunIcon /> : <MonitorIcon />}
      </IconButton>
    </div>
  );
}

function ModeButton({
  current,
  value,
  onSelect,
  label,
}: {
  current: ViewMode;
  value: ViewMode;
  onSelect: (m: ViewMode) => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        active
          ? 'bg-elevated text-text shadow-soft'
          : 'text-muted hover:bg-surface hover:text-text'
      }`}
    >
      {label}
    </button>
  );
}

/* ── Icons (inline to keep bundle small) ───────────────────────────────── */

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
