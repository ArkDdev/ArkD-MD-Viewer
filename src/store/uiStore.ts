import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'view' | 'edit' | 'edit-full';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

/**
 * Theme model:
 * - `themeOverride === null` → follow OS theme (default for first launch)
 * - `themeOverride === 'light' | 'dark'` → user explicitly chose
 *
 * UI exposes only two buttons: light and dark. Clicking one sets the override.
 * If the user wants "system" again, they'd need a way to clear the override —
 * we don't expose that as a button (Claude Desktop also doesn't), but it's
 * available via `clearThemeOverride()` if we ever want a setting for it.
 */
export type ThemeOverride = 'light' | 'dark' | null;

interface UIState {
  mode: ViewMode;
  themeOverride: ThemeOverride;
  fontSize: FontSize;
  readerWidth: 'narrow' | 'wide';

  isSettingsOpen: boolean;
  isDisplayOpen: boolean;

  setMode: (mode: ViewMode) => void;
  toggleEdit: () => void;
  togglePreview: () => void;

  setTheme: (theme: 'light' | 'dark') => void;
  clearThemeOverride: () => void;

  setFontSize: (size: FontSize) => void;
  setReaderWidth: (w: 'narrow' | 'wide') => void;

  openSettings: () => void;
  closeSettings: () => void;
  openDisplay: () => void;
  closeDisplay: () => void;
}

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Returns the currently applied theme based on override + system. */
export function resolveTheme(override: ThemeOverride): 'light' | 'dark' {
  return override ?? systemTheme();
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      mode: 'view',
      themeOverride: null,
      fontSize: 'base',
      readerWidth: 'narrow',

      isSettingsOpen: false,
      isDisplayOpen: false,

      setMode: (mode) => set({ mode }),

      toggleEdit: () => {
        const m = get().mode;
        set({ mode: m === 'view' ? 'edit' : 'view' });
      },

      togglePreview: () => {
        const m = get().mode;
        if (m === 'edit') set({ mode: 'edit-full' });
        else if (m === 'edit-full') set({ mode: 'edit' });
      },

      setTheme: (theme) => {
        applyTheme(theme);
        set({ themeOverride: theme });
      },

      clearThemeOverride: () => {
        applyTheme(systemTheme());
        set({ themeOverride: null });
      },

      setFontSize: (fontSize) => set({ fontSize }),
      setReaderWidth: (readerWidth) => set({ readerWidth }),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      openDisplay: () => set({ isDisplayOpen: true }),
      closeDisplay: () => set({ isDisplayOpen: false }),
    }),
    {
      name: 'arkd-ui',
      partialize: (state) => ({
        mode: state.mode,
        themeOverride: state.themeOverride,
        fontSize: state.fontSize,
        readerWidth: state.readerWidth,
      }),
    },
  ),
);

/**
 * Initialise theme on app startup. Call once from main.tsx after the store
 * has been hydrated. Sets up a listener so that when the user has no override
 * and changes the OS theme, the app follows.
 */
export function initThemeWatcher() {
  // Apply current effective theme
  const override = useUIStore.getState().themeOverride;
  applyTheme(resolveTheme(override));

  // Watch system changes, applying them only when user has no override
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = (e: MediaQueryListEvent) => {
    if (useUIStore.getState().themeOverride === null) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  };
  // Modern browsers
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
