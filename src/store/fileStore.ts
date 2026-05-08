import { create } from 'zustand';
import { t } from '@/lib/i18n/useT';

export interface LoadFileOptions {
  /**
   * When true, the UI mode should reset to its default for a fresh open
   * (i.e. preview for an external file). The store itself doesn't change
   * the mode — App.tsx watches for `loadFile` calls with `resetMode: true`
   * and switches the mode accordingly.
   *
   * Why this lives in the store and not as a prop on the caller: the watcher
   * also calls loadFile (when an external change is silently reloaded), and
   * we DON'T want a mode reset in that case — the user might be editing.
   * So callers pass `resetMode: true` only when it's a true "open" event:
   *   • menu Open command
   *   • drag & drop
   *   • file association launch
   *
   * The watcher and the welcome-doc init both pass `false` (the default).
   */
  resetMode?: boolean;
}

interface FileState {
  filePath: string | null;
  content: string;
  originalContent: string;
  isDirty: boolean;

  /**
   * Counter that increments on every loadFile / reset call. App.tsx
   * subscribes to it (with the loadFile options) to react to "fresh open"
   * events without ambiguity. Plain content/path subscriptions can't tell
   * apart a real reload from a watcher silent reload.
   */
  loadGeneration: number;
  /** Options from the most recent loadFile / reset call. */
  lastLoadOptions: LoadFileOptions & { kind: 'load' | 'reset' | 'init' };

  setContent: (content: string) => void;
  loadFile: (path: string, content: string, options?: LoadFileOptions) => void;
  markSaved: () => void;
  /** Empty buffer, no path, dirty=false, mode hint = 'reset' for App to switch to edit. */
  reset: () => void;
}

/**
 * Welcome doc is read fresh from translations every time we need it.
 * Used only for the very first launch — `reset()` (i.e. "New file") gives
 * an empty buffer, not the welcome screen.
 */
function welcomeDoc(): string {
  return t('welcome.doc');
}

export const useFileStore = create<FileState>((set) => {
  const initial = welcomeDoc();
  return {
    filePath: null,
    content: initial,
    originalContent: initial,
    isDirty: false,
    loadGeneration: 0,
    lastLoadOptions: { kind: 'init' },

    setContent: (content) =>
      set((state) => ({
        content,
        isDirty: content !== state.originalContent,
      })),

    loadFile: (path, content, options = {}) =>
      set((state) => ({
        filePath: path,
        content,
        originalContent: content,
        isDirty: false,
        loadGeneration: state.loadGeneration + 1,
        lastLoadOptions: { ...options, kind: 'load' },
      })),

    markSaved: () =>
      set((state) => ({
        originalContent: state.content,
        isDirty: false,
      })),

    reset: () =>
      set((state) => ({
        filePath: null,
        content: '',
        originalContent: '',
        isDirty: false,
        loadGeneration: state.loadGeneration + 1,
        lastLoadOptions: { kind: 'reset' },
      })),
  };
});
