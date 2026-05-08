import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from '@/components/chrome/TopBar';
import { SettingsModal } from '@/components/chrome/SettingsModal';
import { DisplayModal } from '@/components/chrome/DisplayModal';
import { DragOverlay } from '@/components/chrome/DragOverlay';
import { ConflictModal } from '@/components/chrome/ConflictModal';
import { UnsavedChangesModal } from '@/components/chrome/UnsavedChangesModal';
import { ReadingProgressBar } from '@/components/chrome/ReadingProgressBar';
import { Renderer } from '@/components/viewer/Renderer';
import { SplitView } from '@/components/viewer/SplitView';
import { Editor, type EditorHandle } from '@/components/editor/Editor';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { registerKeyboardShortcuts } from '@/lib/shortcuts';
import { initFileOpenListener } from '@/lib/fs/openHandler';
import { initWindowCloseGuard } from '@/lib/window/closeGuard';
import { useDragAndDrop } from '@/lib/fs/dragDrop';
import { useFileWatcher } from '@/lib/fs/fileWatcher';
import { translations } from '@/lib/i18n/translations';

export function App() {
  const content = useFileStore((s) => s.content);
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);

  // Subscribe to load events so we can react with mode changes when callers
  // ask for one (resetMode: true on Open / drag&drop / file-association).
  const loadGeneration = useFileStore((s) => s.loadGeneration);

  const editorRef = useRef<EditorHandle>(null);
  const viewRendererRef = useRef<HTMLDivElement>(null);

  // Scroll target for the reading progress bar — depends on the current mode.
  // We keep it in state (not refs) so the progress bar gets updated when refs
  // change after mode switches.
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | null>(null);

  const dragState = useDragAndDrop();
  const { conflict, reload, keepLocal } = useFileWatcher();

  useEffect(() => {
    const cleanupShortcuts = registerKeyboardShortcuts();
    initFileOpenListener();

    /*
     * Close-request guard. The promise resolves with the cleanup function
     * once Tauri's listener is attached. We track it via a ref so we can
     * detach on unmount even though it arrives asynchronously.
     */
    let cleanupClose: (() => void) | undefined;
    initWindowCloseGuard().then((fn) => {
      cleanupClose = fn;
    });

    return () => {
      cleanupShortcuts();
      cleanupClose?.();
    };
  }, []);

  /*
   * React to load events. The fileStore exposes a `lastLoadOptions` value
   * that says what kind of load just happened:
   *
   *   kind: 'load' + resetMode: true  → external open (menu / drag / OS)
   *                                      → switch to view (.md is "read first")
   *   kind: 'reset'                    → "New file" command
   *                                      → switch to edit (split) for typing
   *   kind: 'load' + resetMode: false  → silent reload from watcher
   *                                      → leave mode alone, the user is mid-task
   *   kind: 'init'                     → first store creation
   *                                      → leave mode alone
   *
   * Effect runs whenever loadGeneration changes, which guarantees we react
   * to *every* explicit load event without misfiring on unrelated content
   * updates (typing in the editor doesn't bump the generation).
   */
  useEffect(() => {
    if (loadGeneration === 0) return; // initial state, no transition to react to

    const opts = useFileStore.getState().lastLoadOptions;
    if (opts.kind === 'load' && opts.resetMode) {
      useUIStore.getState().setMode('view');
    } else if (opts.kind === 'reset') {
      useUIStore.getState().setMode('edit');
    }
    // 'load' without resetMode → silent reload, no mode change
    // 'init' shouldn't reach here because of the guard above
  }, [loadGeneration]);

  /*
   * Live-translate the welcome doc on language change. Only relevant on the
   * initial state — once the user does anything (opens a file, types, hits
   * "New file"), the welcome doc is gone and there's nothing to retranslate.
   *
   * We compare against ALL known welcome strings so it works even after
   * multiple language switches in a row.
   */
  useEffect(() => {
    const state = useFileStore.getState();
    if (state.filePath !== null || state.isDirty) return;

    const isCurrentlyOnWelcome = Object.values(translations).some(
      (dict) => dict['welcome.doc'] === state.content,
    );
    if (!isCurrentlyOnWelcome) return;

    const newWelcome = translations[language]['welcome.doc'];
    if (newWelcome && newWelcome !== state.content) {
      // Manual store mutation — we're not really "loading a file", just
      // swapping the welcome content language. Skipping loadFile keeps
      // loadGeneration stable so the mode-reaction effect above doesn't fire.
      useFileStore.setState({
        content: newWelcome,
        originalContent: newWelcome,
        isDirty: false,
      });
    }
  }, [language]);

  /*
   * Update the scroll target whenever the mode changes or the scroller refs
   * resolve. The progress bar reads this and attaches its listener.
   *
   *   view       → Renderer's wrapping div (its forwarded ref)
   *   edit-full  → Editor's internal cm-scroller (via EditorHandle.getScroller)
   *   edit       → preview pane's scroller (delivered via SplitView callback)
   */
  useEffect(() => {
    if (mode === 'view') {
      setScrollTarget(viewRendererRef.current);
    } else if (mode === 'edit-full') {
      setScrollTarget(editorRef.current?.getScroller() ?? null);
    }
    // 'edit' (split) target is set by SplitView via the onPreviewScrollerReady
    // callback below — handled separately.
  }, [mode, content]);

  // Stable callback so SplitView's effect doesn't refire each render.
  const handlePreviewScrollerReady = useCallback((el: HTMLDivElement | null) => {
    setScrollTarget(el);
  }, []);

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <TopBar />
      <ReadingProgressBar target={scrollTarget} />

      <main className="relative flex-1 overflow-hidden">
        {mode === 'view' && <Renderer ref={viewRendererRef} source={content} />}
        {mode === 'edit' && <SplitView onPreviewScrollerReady={handlePreviewScrollerReady} />}
        {mode === 'edit-full' && <Editor ref={editorRef} showPaneToggle isFull />}

        <DragOverlay state={dragState} />
      </main>

      <SettingsModal />
      <DisplayModal />
      <ConflictModal
        show={conflict.hasConflict}
        filePath={conflict.path}
        onReload={reload}
        onKeep={keepLocal}
      />
      <UnsavedChangesModal />
    </div>
  );
}
