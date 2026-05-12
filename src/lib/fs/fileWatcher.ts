import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { readFileByPath } from '@/lib/fs/files';

export interface ExternalChangeState {
  hasConflict: boolean;
  path: string | null;
  /** Latest content read from disk, kept so Reload applies the right version */
  pendingContent: string | null;
}

/**
 * File watcher with smart conflict resolution.
 *
 *   • view mode + clean buffer    → silently reload
 *   • view mode + dirty buffer    → show banner
 *   • edit/edit-full + ANY state  → ALWAYS show banner — the user is actively
 *                                    editing, so a silent rewrite would be
 *                                    jarring even when the buffer is clean
 *
 * "Reload" applies the pending content; "Keep mine" dismisses the banner
 * and leaves the editor untouched (next save will overwrite disk).
 */
export function useFileWatcher(): {
  conflict: ExternalChangeState;
  reload: () => void;
  keepLocal: () => void;
} {
  const filePath = useFileStore((s) => s.filePath);
  const [conflict, setConflict] = useState<ExternalChangeState>({
    hasConflict: false,
    path: null,
    pendingContent: null,
  });

  // Start/stop the Rust watcher when the open file changes
  useEffect(() => {
    if (!filePath) {
      invoke('stop_watching').catch(() => {});
      return;
    }
    invoke('start_watching', { path: filePath }).catch((err) => {
      console.warn('Failed to start watcher:', err);
    });
    return () => {
      invoke('stop_watching').catch(() => {});
    };
  }, [filePath]);

  // Listen for `file-changed` events emitted by the Rust watcher
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let mounted = true;

    (async () => {
      const fn = await listen<string>('file-changed', async (event) => {
        const changedPath = event.payload;
        const fileState = useFileStore.getState();
        const uiState = useUIStore.getState();

        // Only react if the changed file is the one we have open
        if (fileState.filePath !== changedPath) return;

        // Read fresh content from disk. readFileByPath returns null if
        // the user dismissed a size/binary warning — in the watcher
        // context that should never actually happen (the file is already
        // open, so we've passed those checks once already), but we still
        // handle it defensively rather than crashing on .content.
        let freshContent: string;
        try {
          const file = await readFileByPath(changedPath);
          if (!file) return;
          freshContent = file.content;
        } catch {
          return; // file might be in mid-write; ignore
        }

        // No actual change — likely caused by our own (already-saved) write
        if (freshContent === fileState.content) return;

        const inEditMode = uiState.mode === 'edit' || uiState.mode === 'edit-full';
        const shouldShowBanner = inEditMode || fileState.isDirty;

        if (shouldShowBanner) {
          setConflict({
            hasConflict: true,
            path: changedPath,
            pendingContent: freshContent,
          });
        } else {
          // view mode + clean buffer → silent reload
          fileState.loadFile(changedPath, freshContent);
        }
      });

      if (mounted) {
        unlisten = fn;
      } else {
        // Component unmounted before async listen() resolved — clean up immediately
        fn();
      }
    })();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  const reload = () => {
    if (!conflict.path || conflict.pendingContent === null) return;
    useFileStore.getState().loadFile(conflict.path, conflict.pendingContent);
    setConflict({ hasConflict: false, path: null, pendingContent: null });
  };

  const keepLocal = () => {
    setConflict({ hasConflict: false, path: null, pendingContent: null });
  };

  return { conflict, reload, keepLocal };
}
