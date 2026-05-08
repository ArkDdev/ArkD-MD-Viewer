import { create } from 'zustand';
import { t } from '@/lib/i18n/useT';
import { detectFileType, type FileCategory } from '@/lib/fs/fileType';

export interface LoadFileOptions {
  /**
   * When true, the UI mode should reset to its default for a fresh open
   * (i.e. view for any file). App.tsx watches for `loadFile` calls with
   * `resetMode: true` and switches the mode accordingly.
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
   * Detected from the file's extension on every load. For the welcome doc
   * and any unnamed buffer we use 'markdown' (sensible default — the user
   * almost certainly wants to write markdown when starting fresh).
   */
  category: FileCategory;

  /**
   * Counter that increments on every loadFile / reset call. App.tsx
   * subscribes to it to react to "fresh open" events.
   */
  loadGeneration: number;
  lastLoadOptions: LoadFileOptions & { kind: 'load' | 'reset' | 'init' };

  setContent: (content: string) => void;
  loadFile: (path: string, content: string, options?: LoadFileOptions) => void;
  markSaved: () => void;
  /** Empty buffer, no path, category=markdown (for the New File flow). */
  reset: () => void;
}

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
    category: 'markdown',
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
        category: detectFileType(path),
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
        category: 'markdown',
        loadGeneration: state.loadGeneration + 1,
        lastLoadOptions: { kind: 'reset' },
      })),
  };
});
