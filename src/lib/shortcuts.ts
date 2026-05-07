import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { pickAndOpenFile, saveFile, saveFileAs } from '@/lib/fs/files';

/**
 * Registers global keyboard shortcuts. Returns a cleanup function.
 *
 * IMPORTANT: We match by `event.code` (physical key) rather than `event.key`
 * (logical character). This makes the shortcuts work regardless of keyboard
 * layout — Ctrl+S works on both English (S) and Russian (Ы) layouts because
 * the physical key with `code === 'KeyS'` is the same in both cases.
 *
 * `event.key` is only used for non-letter keys like `,` where there's no
 * universal `code` mapping (the `Comma` code does work, so we use it too).
 */
export function registerKeyboardShortcuts(): () => void {
  const onKeyDown = async (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    // Ignore shortcuts that originate from inside text input contexts where
    // they have a different meaning (e.g. Ctrl+A in CodeMirror selects all
    // text, not "Open"). Our shortcuts (N/O/E/S) don't conflict with stand-
    // ard editing shortcuts so this isn't strictly needed, but defensive.
    // Skip: nothing to skip for now.

    switch (e.code) {
      // Ctrl+N — new file
      case 'KeyN': {
        if (e.shiftKey) return;
        e.preventDefault();
        useFileStore.getState().reset();
        useUIStore.getState().setMode('edit');
        return;
      }

      // Ctrl+O — open
      case 'KeyO': {
        if (e.shiftKey) return;
        e.preventDefault();
        const file = await pickAndOpenFile();
        if (file) useFileStore.getState().loadFile(file.path, file.content);
        return;
      }

      // Ctrl+E — toggle edit/view
      case 'KeyE': {
        if (e.shiftKey) return;
        e.preventDefault();
        useUIStore.getState().toggleEdit();
        return;
      }

      // Ctrl+S / Ctrl+Shift+S — save / save as
      case 'KeyS': {
        e.preventDefault();
        const { content, loadFile, markSaved, filePath } = useFileStore.getState();
        if (e.shiftKey) {
          const newPath = await saveFileAs(content);
          if (newPath) loadFile(newPath, content);
        } else {
          if (filePath) {
            await saveFile(filePath, content);
            markSaved();
          } else {
            const newPath = await saveFileAs(content);
            if (newPath) loadFile(newPath, content);
          }
        }
        return;
      }

      // Ctrl+, — settings
      case 'Comma': {
        e.preventDefault();
        useUIStore.getState().openSettings();
        return;
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
