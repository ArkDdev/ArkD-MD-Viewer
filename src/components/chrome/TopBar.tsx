import { useFileStore } from '@/store/fileStore';
import { useUIStore, resolveTheme } from '@/store/uiStore';
import { useT } from '@/lib/i18n/useT';
import { isMarkdown } from '@/lib/fs/fileType';
import { MenuButton } from './MenuButton';
import { ModeBadge } from './ModeBadge';
import { AdminBadge } from './AdminBadge';
import { WindowControls } from './WindowControls';
import {
  SunIcon,
  MoonIcon,
  PencilIcon,
  EyeIcon,
  SlidersIcon,
} from '@/components/ui/Icons';

/**
 * Top chrome bar.
 *
 * Layout uses a 3-column CSS grid: `[auto | 1fr | auto]`. Left and right
 * cells size to their content; the middle cell takes whatever's left.
 * The file name is text-centred inside that middle cell, which places it
 * visually halfway between whatever sits on the left (burger, optional
 * mode badge) and whatever sits on the right (theme buttons, display,
 * edit toggle, window controls).
 *
 * Why this pattern, not `[1fr | auto | 1fr]`: the latter centres the
 * filename relative to the entire window width, which means a wide
 * filename can collide with content on whichever side has more buttons.
 * Centring inside the remaining space between two auto-sized clusters
 * is what feels natural to users — the title sits exactly between the
 * "stuff on the left" and "stuff on the right".
 */
export function TopBar() {
  const { filePath, isDirty, category } = useFileStore();
  const { mode, themeOverride, setTheme, toggleEdit, openDisplay, isAdmin } = useUIStore();
  const t = useT();

  const fileName = filePath
    ? filePath.split(/[/\\]/).pop() ?? t('file.untitled')
    : t('file.untitled');

  const isEditing = mode === 'edit' || mode === 'edit-full';
  const effectiveTheme = resolveTheme(themeOverride);
  const isMd = isMarkdown(category);

  // Title suffix when running elevated — communicates the elevated state
  // even when the AdminBadge isn't directly in the user's gaze. Localised
  // via the same i18n key as the badge so RU/EN stay consistent.
  const adminSuffix = isAdmin ? ` (${t('elevation.adminBadge')})` : '';

  return (
    <div
      data-tauri-drag-region
      className="grid h-10 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center border-b border-border bg-bg select-none"
    >
      {/* Left zone — burger + mode badge (only for non-md) + admin badge
          (only when elevated). Auto-width so the centre zone gets all
          remaining space. */}
      <div className="flex h-full items-center gap-1.5 pl-2" data-tauri-drag-region>
        <MenuButton />
        {isAdmin && <AdminBadge />}
        {!isMd && <ModeBadge isEditing={isEditing} />}
      </div>

      {/* Centre zone — file name + optional admin suffix. */}
      <div className="flex h-full min-w-0 items-center px-4" data-tauri-drag-region>
        <span
          className="block w-full truncate text-xs text-muted"
          style={{
            direction: 'rtl',
            textAlign: 'center',
            unicodeBidi: 'plaintext',
          }}
          title={(filePath ?? fileName) + adminSuffix}
        >
          {fileName}
          {adminSuffix}
          {isDirty && <span className="ml-1 text-accent">●</span>}
        </span>
      </div>

      {/* Right zone — themes, display, edit toggle, window controls.
          We make the zone `h-full` (full TopBar height = 40px) explicitly,
          rather than relying on row alignment. Then each child decides how
          to fill that height:
            - themes/display/edit group: `items-center` (28px buttons,
              centred vertically in the 40px row)
            - WindowControls: own `h-full items-stretch` (40px hot-zone,
              matching native Windows chrome conventions)

          This was previously broken: the zone had `flex items-stretch` but
          no `h-full`, so its height collapsed to its tallest child (28px),
          making WindowControls' `h-full` resolve to 28px too. The visible
          symptom was a narrow hover band in the middle of each window
          button. With explicit `h-full` here, the 40px is locked in. */}
      <div className="flex h-full items-stretch justify-end" data-tauri-drag-region>
        <div className="flex items-center gap-0.5 pr-2">
          <ThemeButton
            icon={<SunIcon />}
            isActive={effectiveTheme === 'light'}
            onClick={() => setTheme('light')}
            ariaLabel={t('topbar.theme.light')}
          />
          <ThemeButton
            icon={<MoonIcon />}
            isActive={effectiveTheme === 'dark'}
            onClick={() => setTheme('dark')}
            ariaLabel={t('topbar.theme.dark')}
          />

          <div className="mx-1 h-4 w-px bg-border" />

          <ChromeButton
            onClick={openDisplay}
            ariaLabel={t('topbar.display')}
            title={t('topbar.display')}
          >
            <SlidersIcon />
          </ChromeButton>

          <EditToggle isEditing={isEditing} onClick={toggleEdit} />
        </div>

        <WindowControls />
      </div>
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
  const t = useT();
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
      <span>{isEditing ? t('topbar.editToggle.toView') : t('topbar.editToggle.toEdit')}</span>
    </button>
  );
}
