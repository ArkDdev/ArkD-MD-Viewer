import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readFileByPath } from '@/lib/fs/files';
import { useFileStore } from '@/store/fileStore';

const SUPPORTED_EXTENSIONS = ['md', 'markdown', 'mdx', 'mkd'];

function isSupported(path: string): boolean {
  const ext = path.toLowerCase().split('.').pop();
  return ext ? SUPPORTED_EXTENSIONS.includes(ext) : false;
}

export interface DragDropState {
  /** True while files are being dragged over the window */
  isDragOver: boolean;
  /** True when the dragged file(s) include at least one supported one */
  hasSupportedFile: boolean;
  /** Optional message to show in overlay (e.g. error feedback) */
  message: string | null;
}

/**
 * Sets up Tauri-level drag & drop handling.
 * - On enter/over: updates state for visual feedback
 * - On drop: opens the first supported file (md/markdown/mdx/mkd)
 * - Unsupported files are silently ignored (overlay shows feedback)
 *
 * Returns reactive state for rendering the overlay.
 */
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

        if (payload.type === 'enter' || payload.type === 'over') {
          const paths = payload.paths;
          const supported = paths.some(isSupported);
          setState({
            isDragOver: true,
            hasSupportedFile: supported,
            message: supported
              ? paths.length === 1
                ? 'Открыть файл'
                : `Открыть первый из ${paths.length} файлов`
              : 'Поддерживаются только .md, .markdown, .mdx, .mkd',
          });
        } else if (payload.type === 'drop') {
          setState({ isDragOver: false, hasSupportedFile: false, message: null });

          const paths = payload.paths;
          const target = paths.find(isSupported);
          if (target) {
            (async () => {
              try {
                const file = await readFileByPath(target);
                useFileStore.getState().loadFile(file.path, file.content);
              } catch (err) {
                console.error('Failed to open dropped file:', err);
              }
            })();
          }
        } else {
          // 'leave' / 'cancel'
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
