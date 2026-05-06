import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { pickAndOpenFile, saveFile, saveFileAs } from '@/lib/fs/files';

/**
 * Registers global keyboard shortcuts.
 * Returns a cleanup function.
 *
 * Note: we use the browser keydown event rather than Tauri global shortcuts
 * because these are app-scoped and we don't want them to fire when the
 * window isn't focused.
 */
export function registerKeyboardShortcuts(): () => void {
  const onKeyDown = async (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();

    // ⌘O / Ctrl+O — open
    if (key === 'o' && !e.shiftKey) {
      e.preventDefault();
      const file = await pickAndOpenFile();
      if (file) useFileStore.getState().loadFile(file.path, file.content);
      return;
    }

    // ⌘E / Ctrl+E — toggle edit mode
    if (key === 'e' && !e.shiftKey) {
      e.preventDefault();
      useUIStore.getState().toggleEdit();
      return;
    }

    // ⌘S / Ctrl+S — save
    if (key === 's' && !e.shiftKey) {
      e.preventDefault();
      const { filePath, content, markSaved } = useFileStore.getState();
      if (filePath) {
        await saveFile(filePath, content);
        markSaved();
      } else {
        const newPath = await saveFileAs(content);
        if (newPath) {
          useFileStore.getState().loadFile(newPath, content);
        }
      }
      return;
    }

    // ⌘⇧S / Ctrl+Shift+S — save as
    if (key === 's' && e.shiftKey) {
      e.preventDefault();
      const { content } = useFileStore.getState();
      const newPath = await saveFileAs(content);
      if (newPath) {
        useFileStore.getState().loadFile(newPath, content);
      }
      return;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
