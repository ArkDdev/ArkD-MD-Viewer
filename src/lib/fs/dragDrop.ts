import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readFileByPath } from '@/lib/fs/files';
import { guardDirtyBuffer } from '@/lib/fs/guard';
import { isSupported } from '@/lib/fs/fileType';
import { useFileStore } from '@/store/fileStore';
import { t } from '@/lib/i18n/useT';

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
              if (!(await guardDirtyBuffer())) return;
              try {
                const file = await readFileByPath(target);
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
