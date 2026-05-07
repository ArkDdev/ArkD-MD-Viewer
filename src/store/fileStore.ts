import { create } from 'zustand';
import { t } from '@/lib/i18n/useT';

interface FileState {
  filePath: string | null;
  content: string;
  originalContent: string;
  isDirty: boolean;

  setContent: (content: string) => void;
  loadFile: (path: string, content: string) => void;
  markSaved: () => void;
  reset: () => void;
}

/**
 * Welcome doc is read fresh from translations every time we need it,
 * so switching language while on the welcome screen replaces its text
 * instantly via the loadFile path.
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

    setContent: (content) =>
      set((state) => ({
        content,
        isDirty: content !== state.originalContent,
      })),

    loadFile: (path, content) =>
      set({
        filePath: path,
        content,
        originalContent: content,
        isDirty: false,
      }),

    markSaved: () =>
      set((state) => ({
        originalContent: state.content,
        isDirty: false,
      })),

    reset: () => {
      const fresh = welcomeDoc();
      set({
        filePath: null,
        content: fresh,
        originalContent: fresh,
        isDirty: false,
      });
    },
  };
});
