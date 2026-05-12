import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectSystemLanguage, type Language } from '@/lib/i18n/translations';

export type ViewMode = 'view' | 'edit' | 'edit-full';
export type ThemeOverride = 'light' | 'dark' | null;

/* ─── Display preferences ────────────────────────────────────── */

export type ReaderFontFamily = 'serif' | 'sans' | 'mono';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ReaderLineHeight = 'compact' | 'normal' | 'relaxed';
export type ReaderWidth = 'narrow' | 'medium' | 'wide' | 'full';

export type EditorFontSize = 12 | 14 | 16 | 18;

interface UIState {
  mode: ViewMode;
  themeOverride: ThemeOverride;
  language: Language;

  readerFontFamily: ReaderFontFamily;
  readerFontSize: ReaderFontSize;
  readerLineHeight: ReaderLineHeight;
  readerWidth: ReaderWidth;

  editorFontSize: EditorFontSize;
  editorWrap: boolean;

  isSettingsOpen: boolean;
  isDisplayOpen: boolean;

  /**
   * Elevation prompt state. Three distinct UI states because each shows
   * different text and different buttons:
   *
   *   - elevationPrompt: Windows access-denied → offer UAC relaunch
   *   - elevationUnsupported: macOS/Linux access-denied → manual instructions
   *   - elevationRecovery: leftover state file from a previous declined UAC
   *
   * They never overlap in practice (the conditions are mutually exclusive),
   * so we represent them as independent booleans rather than a single
   * union — simpler to reason about and to manipulate.
   */
  isElevationPromptOpen: boolean;
  isElevationUnsupportedOpen: boolean;
  isElevationRecoveryOpen: boolean;

  /** True if this process was launched with admin/root rights. */
  isAdmin: boolean;

  setMode: (mode: ViewMode) => void;
  toggleEdit: () => void;
  togglePreview: () => void;

  setTheme: (theme: 'light' | 'dark') => void;
  clearThemeOverride: () => void;

  setLanguage: (lang: Language) => void;

  setReaderFontFamily: (f: ReaderFontFamily) => void;
  setReaderFontSize: (s: ReaderFontSize) => void;
  setReaderLineHeight: (h: ReaderLineHeight) => void;
  setReaderWidth: (w: ReaderWidth) => void;

  setEditorFontSize: (s: EditorFontSize) => void;
  setEditorWrap: (w: boolean) => void;

  resetDisplay: () => void;

  openSettings: () => void;
  closeSettings: () => void;
  openDisplay: () => void;
  closeDisplay: () => void;

  openElevationPrompt: () => void;
  closeElevationPrompt: () => void;
  openElevationUnsupported: () => void;
  closeElevationUnsupported: () => void;
  openElevationRecovery: () => void;
  closeElevationRecovery: () => void;

  setIsAdmin: (admin: boolean) => void;
}

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function resolveTheme(override: ThemeOverride): 'light' | 'dark' {
  return override ?? systemTheme();
}

const DISPLAY_DEFAULTS = {
  readerFontFamily: 'serif' as ReaderFontFamily,
  readerFontSize: 'base' as ReaderFontSize,
  readerLineHeight: 'normal' as ReaderLineHeight,
  readerWidth: 'narrow' as ReaderWidth,
  editorFontSize: 14 as EditorFontSize,
  editorWrap: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      mode: 'view',
      themeOverride: null,
      // Initial language detection happens once when persisted state has none
      language: detectSystemLanguage(),
      ...DISPLAY_DEFAULTS,

      isSettingsOpen: false,
      isDisplayOpen: false,
      isElevationPromptOpen: false,
      isElevationUnsupportedOpen: false,
      isElevationRecoveryOpen: false,
      isAdmin: false,

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

      setLanguage: (language) => set({ language }),

      setReaderFontFamily: (readerFontFamily) => set({ readerFontFamily }),
      setReaderFontSize: (readerFontSize) => set({ readerFontSize }),
      setReaderLineHeight: (readerLineHeight) => set({ readerLineHeight }),
      setReaderWidth: (readerWidth) => set({ readerWidth }),

      setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
      setEditorWrap: (editorWrap) => set({ editorWrap }),

      resetDisplay: () => set({ ...DISPLAY_DEFAULTS }),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      openDisplay: () => set({ isDisplayOpen: true }),
      closeDisplay: () => set({ isDisplayOpen: false }),

      openElevationPrompt: () => set({ isElevationPromptOpen: true }),
      closeElevationPrompt: () => set({ isElevationPromptOpen: false }),
      openElevationUnsupported: () => set({ isElevationUnsupportedOpen: true }),
      closeElevationUnsupported: () => set({ isElevationUnsupportedOpen: false }),
      openElevationRecovery: () => set({ isElevationRecoveryOpen: true }),
      closeElevationRecovery: () => set({ isElevationRecoveryOpen: false }),

      setIsAdmin: (admin) => set({ isAdmin: admin }),
    }),
    {
      name: 'arkd-ui',
      partialize: (state) => ({
        mode: state.mode,
        themeOverride: state.themeOverride,
        language: state.language,
        readerFontFamily: state.readerFontFamily,
        readerFontSize: state.readerFontSize,
        readerLineHeight: state.readerLineHeight,
        readerWidth: state.readerWidth,
        editorFontSize: state.editorFontSize,
        editorWrap: state.editorWrap,
      }),
    },
  ),
);

export function initThemeWatcher() {
  const override = useUIStore.getState().themeOverride;
  applyTheme(resolveTheme(override));

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = (e: MediaQueryListEvent) => {
    if (useUIStore.getState().themeOverride === null) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
