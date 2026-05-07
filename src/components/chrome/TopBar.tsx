import { useFileStore } from '@/store/fileStore';
import { useUIStore, resolveTheme } from '@/store/uiStore';
import { MenuButton } from './MenuButton';
import { WindowControls } from './WindowControls';
import {
  SunIcon,
  MoonIcon,
  PencilIcon,
  EyeIcon,
  SlidersIcon,
} from '@/components/ui/Icons';

export function TopBar() {
  const { filePath, isDirty } = useFileStore();
  const { mode, themeOverride, setTheme, toggleEdit, openDisplay } = useUIStore();

  const fileName = filePath
    ? filePath.split(/[/\\]/).pop() ?? 'Untitled'
    : 'Untitled';

  const isEditing = mode === 'edit' || mode === 'edit-full';
  const effectiveTheme = resolveTheme(themeOverride);

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-10 shrink-0 items-stretch border-b border-border bg-bg select-none"
    >
      {/* Left: burger menu */}
      <div className="flex items-center gap-1 px-2" data-tauri-drag-region>
        <MenuButton />
      </div>

      {/* Center: file name (truncated in middle for long paths) */}
      <div
        data-tauri-drag-region
        className="pointer-events-none absolute inset-x-0 top-0 flex h-10 items-center justify-center px-40"
      >
        <span
          className="truncate text-xs text-muted"
          style={{
            direction: 'rtl',
            textAlign: 'center',
            unicodeBidi: 'plaintext',
          }}
          title={filePath ?? fileName}
        >
          {fileName}
          {isDirty && <span className="ml-1 text-accent">●</span>}
        </span>
      </div>

      <div className="flex-1" data-tauri-drag-region />

      {/* Right: theme buttons + display + edit toggle */}
      <div className="flex items-center gap-0.5 px-2" data-tauri-drag-region>
        <ThemeButton
          icon={<SunIcon />}
          isActive={effectiveTheme === 'light'}
          onClick={() => setTheme('light')}
          ariaLabel="Светлая тема"
        />
        <ThemeButton
          icon={<MoonIcon />}
          isActive={effectiveTheme === 'dark'}
          onClick={() => setTheme('dark')}
          ariaLabel="Тёмная тема"
        />

        <div className="mx-1 h-4 w-px bg-border" />

        <ChromeButton onClick={openDisplay} ariaLabel="Display" title="Отображение">
          <SlidersIcon />
        </ChromeButton>

        <EditToggle isEditing={isEditing} onClick={toggleEdit} />
      </div>

      <WindowControls />
    </div>
  );
}

function ThemeButton({
  icon,
  isActive,
  onClick,
  ariaLabel,
}: {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${
        isActive
          ? 'bg-surface text-text'
          : 'text-muted hover:bg-surface/60 hover:text-text'
      }`}
    >
      {icon}
    </button>
  );
}

function ChromeButton({
  onClick,
  children,
  ariaLabel,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-text"
    >
      {children}
    </button>
  );
}

function EditToggle({ isEditing, onClick }: { isEditing: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`ml-1 flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors duration-150 ${
        isEditing
          ? 'bg-accent/10 text-accent hover:bg-accent/15'
          : 'text-muted hover:bg-surface hover:text-text'
      }`}
    >
      {isEditing ? <EyeIcon /> : <PencilIcon />}
      <span>{isEditing ? 'Просмотр' : 'Редактирование'}</span>
    </button>
  );
}
