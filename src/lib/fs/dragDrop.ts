import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readFileByPath } from '@/lib/fs/files';
import { guardDirtyBuffer } from '@/lib/fs/guard';
import { useFileStore } from '@/store/fileStore';
import { t } from '@/lib/i18n/useT';

export interface DragDropState {
  isDragOver: boolean;
  hasSupportedFile: boolean;
  message: string | null;
}

/**
 * Whether a path looks like a regular file we can read. We deliberately
 * accept anything — extension gating was removed in v1.2.4 to match the
 * "any file opens as text" UX of Notepad++ / VSCode. The size/binary
 * guards in files.ts handle the edge cases (huge .iso, binaries, etc.).
 *
 * The only path we still reject is one that's empty or clearly a folder
 * (no extension AND no filename). For now we just take any path the OS
 * gave us — Tauri's onDragDrop only fires for files, not folders.
 */
function isDroppable(path: string): boolean {
  return path.length > 0;
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

    (async () => {
      const unlisten = await win.onDragDropEvent((event) => {
        const payload = event.payload;

        if (payload.type === 'enter') {
          const paths = payload.paths;
          const droppable = paths.some(isDroppable);
          setState({
            isDragOver: true,
            hasSupportedFile: droppable,
            message: droppable
              ? paths.length === 1
                ? t('dragdrop.openOne')
                : t('dragdrop.openFirstOf', { count: paths.length })
              : t('dragdrop.unsupported'),
          });
        } else if (payload.type === 'drop') {
          setState({ isDragOver: false, hasSupportedFile: false, message: null });

          const paths = payload.paths;
          const target = paths.find(isDroppable);
          if (target) {
            (async () => {
              if (!(await guardDirtyBuffer())) return;
              try {
                const file = await readFileByPath(target);
                // readFileByPath now returns null if the user dismissed
                // the size/binary warning — treat that as a silent no-op.
                if (!file) return;
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
      });

      cleanup = unlisten;
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return state;
}
