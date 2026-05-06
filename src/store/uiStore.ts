import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'view' | 'edit' | 'split';
export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface UIState {
  mode: ViewMode;
  theme: Theme;
  fontSize: FontSize;
  readerWidth: 'narrow' | 'wide';

  setMode: (mode: ViewMode) => void;
  toggleEdit: () => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setReaderWidth: (w: 'narrow' | 'wide') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mode: 'view',
      theme: 'system',
      fontSize: 'base',
      readerWidth: 'narrow',

      setMode: (mode) => set({ mode }),
      toggleEdit: () =>
        set((s) => ({ mode: s.mode === 'view' ? 'edit' : 'view' })),
      setTheme: (theme) => {
        const root = document.documentElement;
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        set({ theme });
      },
      setFontSize: (fontSize) => set({ fontSize }),
      setReaderWidth: (readerWidth) => set({ readerWidth }),
    }),
    {
      name: 'arkd-ui',
    },
  ),
);
