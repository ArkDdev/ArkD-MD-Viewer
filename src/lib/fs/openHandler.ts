import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { readFileByPath } from './files';
import { useFileStore } from '@/store/fileStore';

/**
 * Wires up two flows for opening files from outside the app:
 *
 * 1. Initial launch — when the OS starts ArkD with a file path argument
 *    (e.g. double-click on a .md file in Finder/Explorer), the Rust side
 *    sends back the path via the `get_initial_file` command.
 *
 * 2. Subsequent opens — on macOS, opening another .md file while the app
 *    is running fires a `file-open` event from the Rust side.
 */
export async function initFileOpenListener(): Promise<void> {
  // 1. Initial launch
  try {
    const initialPath = await invoke<string | null>('get_initial_file');
    if (initialPath) {
      const file = await readFileByPath(initialPath);
      // Initial launch from file association — user double-clicked an .md
      // file in Explorer. They want to read it, so switch to view mode.
      useFileStore.getState().loadFile(file.path, file.content, { resetMode: true });
    }
  } catch (err) {
    console.warn('No initial file or failed to read:', err);
  }

  // 2. Subsequent opens
  await listen<string>('file-open', async (event) => {
    try {
      const file = await readFileByPath(event.payload);
      // External "open with" event — same as initial launch, switch to view.
      useFileStore.getState().loadFile(file.path, file.content, { resetMode: true });
    } catch (err) {
      console.error('Failed to open file from event:', err);
    }
  });
}
