import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readFileByPath } from '@/lib/fs/files';
import { useFileStore } from '@/store/fileStore';
import { t } from '@/lib/i18n/useT';

const SUPPORTED_EXTENSIONS = ['md', 'markdown', 'mdx', 'mkd'];

function isSupported(path: string): boolean {
  const ext = path.toLowerCase().split('.').pop();
  return ext ? SUPPORTED_EXTENSIONS.includes(ext) : false;
}

export interface DragDropState {
  isDragOver: boolean;
  hasSupportedFile: boolean;
  message: string | null;
}

export function useDragAndDrop(): DragDropState {
  const [state, setState] = useState<DragDropState>({
    isDragOver: false,
    hasSupportedFile: false,
    message: null,
  });

  useEffect(() => {
    const win = getCurrentWindow();
    let cleanup: (() => void) | undefined;

    /*
     * Tauri 2 emits four event types:
     *   - enter: paths included, cursor entered the window
     *   - over:  no paths (only cursor position) — they're already known
     *            from `enter`. We don't need to recompute the overlay state.
     *   - drop:  paths included again, the user released
     *   - leave: cursor left without dropping
     *
     * We compute the overlay state on `enter` and `drop` only, leaving
     * `over` as a no-op. This matches the shape of Tauri's discriminated
     * union and keeps strict TypeScript happy.
     */
    (async () => {
      const unlisten = await win.onDragDropEvent((event) => {
        const payload = event.payload;

        if (payload.type === 'enter') {
          const paths = payload.paths;
          const supported = paths.some(isSupported);
          setState({
            isDragOver: true,
            hasSupportedFile: supported,
            message: supported
              ? paths.length === 1
                ? t('dragdrop.openOne')
                : t('dragdrop.openFirstOf', { count: paths.length })
              : t('dragdrop.unsupported'),
          });
        } else if (payload.type === 'drop') {
          setState({ isDragOver: false, hasSupportedFile: false, message: null });

          const paths = payload.paths;
          const target = paths.find(isSupported);
          if (target) {
            (async () => {
              try {
                const file = await readFileByPath(target);
                // resetMode: true — dropping a file is a "fresh open" event,
                // App.tsx will switch back to view mode for .md preview.
                useFileStore.getState().loadFile(file.path, file.content, {
                  resetMode: true,
                });
              } catch (err) {
                console.error('Failed to open dropped file:', err);
              }
            })();
          }
        } else if (payload.type === 'leave') {
          setState({ isDragOver: false, hasSupportedFile: false, message: null });
        }
        // 'over' has no paths and no state change — we ignore it
      });

      cleanup = unlisten;
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return state;
}
