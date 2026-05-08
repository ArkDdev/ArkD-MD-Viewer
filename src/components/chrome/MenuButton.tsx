import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { pickAndOpenFile, saveFile, saveFileAs } from '@/lib/fs/files';
import { guardDirtyBuffer } from '@/lib/fs/guard';
import { useT } from '@/lib/i18n/useT';
import {
  MenuIcon,
  FileIcon,
  FolderIcon,
  SaveIcon,
  SaveAsIcon,
  SettingsIcon,
} from '@/components/ui/Icons';

export function MenuButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleNew = async () => {
    setOpen(false);
    if (!(await guardDirtyBuffer())) return;
    // Reset to empty buffer (handled inside the store) and switch to split
    // edit mode — the user just asked for a new file, they'll want to type.
    useFileStore.getState().reset();
    useUIStore.getState().setMode('edit');
  };

  const handleOpen = async () => {
    setOpen(false);
    if (!(await guardDirtyBuffer())) return;
    const file = await pickAndOpenFile();
    if (file) {
      // resetMode: true tells App.tsx to switch to view mode after loading,
      // because opening an .md file is a "read first" action by default.
      useFileStore.getState().loadFile(file.path, file.content, { resetMode: true });
    }
  };

  const handleSave = async () => {
    setOpen(false);
    const { filePath, content, markSaved, loadFile } = useFileStore.getState();
    if (filePath) {
      await saveFile(filePath, content);
      markSaved();
    } else {
      const newPath = await saveFileAs(content);
      if (newPath) loadFile(newPath, content);
    }
  };

  const handleSaveAs = async () => {
    setOpen(false);
    const { content, loadFile } = useFileStore.getState();
    const newPath = await saveFileAs(content);
    if (newPath) loadFile(newPath, content);
  };

  const handleSettings = () => {
    setOpen(false);
    useUIStore.getState().openSettings();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('topbar.menu')}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${
          open ? 'bg-surface text-text' : 'text-muted hover:bg-surface hover:text-text'
        }`}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-72 overflow-hidden rounded-lg border border-border bg-elevated shadow-elevated">
          <MenuItem icon={<FileIcon />} label={t('menu.new')} hint="Ctrl+N" onClick={handleNew} />
          <MenuItem icon={<FolderIcon />} label={t('menu.open')} hint="Ctrl+O" onClick={handleOpen} />
          <MenuDivider />
          <MenuItem icon={<SaveIcon />} label={t('menu.save')} hint="Ctrl+S" onClick={handleSave} />
          <MenuItem
            icon={<SaveAsIcon />}
            label={t('menu.saveAs')}
            hint="Ctrl+Shift+S"
            onClick={handleSaveAs}
          />
          <MenuDivider />
          <MenuItem icon={<SettingsIcon />} label={t('menu.settings')} onClick={handleSettings} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">{icon}</span>
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {hint && (
        <span className="shrink-0 whitespace-nowrap font-mono text-xs text-subtle">{hint}</span>
      )}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-border" />;
}
