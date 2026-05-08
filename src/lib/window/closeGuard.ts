import { getCurrentWindow } from '@tauri-apps/api/window';
import { guardDirtyBuffer } from '@/lib/fs/guard';

/**
 * Intercept the user's request to close the window (X button, Alt+F4, etc.)
 * and run the unsaved-changes guard before allowing the window to actually
 * close.
 *
 * Tauri 2 sends a `close-requested` event before closing. We call
 * `event.preventDefault()` synchronously, decide what to do, and then
 * either close the window or do nothing (Cancel branch).
 *
 * Returns a cleanup function that detaches the listener.
 *
 * Why we set a guard flag during the close-confirmation flow:
 * if the guard ends up calling Save As, that's an async dialog. While
 * we're waiting for the user, another close-requested might fire (e.g.
 * if the user double-clicks X). Without the flag, we'd queue up a second
 * modal and surprise behaviour. The flag debounces it.
 */
export async function initWindowCloseGuard(): Promise<() => void> {
  const win = getCurrentWindow();
  let closing = false;

  const unlisten = await win.onCloseRequested(async (event) => {
    if (closing) {
      // Already running through the guard — let the second event proceed
      // (it will hit the same guard and do the right thing).
      return;
    }

    // Always prevent the immediate close — we'll close manually after
    // the guard resolves.
    event.preventDefault();

    closing = true;
    try {
      const ok = await guardDirtyBuffer();
      if (ok) {
        await win.destroy();
      }
    } finally {
      closing = false;
    }
  });

  return unlisten;
}
