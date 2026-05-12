import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from '@/components/chrome/TopBar';
import { SettingsModal } from '@/components/chrome/SettingsModal';
import { DisplayModal } from '@/components/chrome/DisplayModal';
import { DragOverlay } from '@/components/chrome/DragOverlay';
import { ConflictModal } from '@/components/chrome/ConflictModal';
import { UnsavedChangesModal } from '@/components/chrome/UnsavedChangesModal';
import { ReadingProgressBar } from '@/components/chrome/ReadingProgressBar';
import {
  ElevationPromptModal,
  ElevationUnsupportedModal,
  ElevationRecoveryModal,
} from '@/components/chrome/ElevationModals';
import { LargeOrBinaryModal } from '@/components/chrome/LargeOrBinaryModal';
import { Renderer } from '@/components/viewer/Renderer';
import { SplitView } from '@/components/viewer/SplitView';
import { JsonTreeViewer } from '@/components/viewer/JsonTreeViewer';
import { Editor, type EditorHandle } from '@/components/editor/Editor';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { registerKeyboardShortcuts } from '@/lib/shortcuts';
import { initFileOpenListener } from '@/lib/fs/openHandler';
import { initWindowCloseGuard } from '@/lib/window/closeGuard';
import { useDragAndDrop } from '@/lib/fs/dragDrop';
import { useFileWatcher } from '@/lib/fs/fileWatcher';
import { translations } from '@/lib/i18n/translations';
import { isMarkdown, isStructured } from '@/lib/fs/fileType';
import {
  readElevatedStartupState,
  readRecoveryState,
  applyHydrationState,
  checkIsAdmin,
  type ElevationStateSnapshot,
} from '@/lib/elevation/elevation';

export function App() {
  const content = useFileStore((s) => s.content);
  const category = useFileStore((s) => s.category);
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);

  const loadGeneration = useFileStore((s) => s.loadGeneration);

  const editorRef = useRef<EditorHandle>(null);

  // Reading progress target. We use a single state cell + callback refs
  // from each scrollable component. The callbacks fire on mount AND unmount
  // (with null), so we always have an up-to-date target — no stale refs
  // pointing at detached DOM nodes after a mode switch.
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | null>(null);

  /**
   * Snapshot we may need to surface in the recovery modal (orphan state from
   * a previously declined UAC prompt). Holds the parsed payload so the
   * modal can render filename / etc. Set once on startup, cleared on
   * Restore or Discard.
   */
  const [recoverySnapshot, setRecoverySnapshot] = useState<ElevationStateSnapshot | null>(null);

  const dragState = useDragAndDrop();
  const { conflict, reload, keepLocal } = useFileWatcher();

  /*
   * Startup elevation flow.
   *
   * Three distinct cases, checked in order:
   *
   *   1. `--elevated-startup`: this process was launched via UAC. Read the
   *      state JSON and rehydrate. The original (unelevated) process has
   *      already exited.
   *
   *   2. Orphan state file exists from a previous abandoned attempt (user
   *      declined UAC). Offer the recovery modal — letting them keep their
   *      unsaved changes.
   *
   *   3. Neither: normal startup. Do nothing here.
   *
   * Also independently: probe isAdmin and update the store so the badge /
   * title suffix render correctly.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Admin probe — independent of which startup case we're in
        const admin = await checkIsAdmin();
        if (cancelled) return;
        useUIStore.getState().setIsAdmin(admin);

        // Case 1: elevated launch
        const elevatedState = await readElevatedStartupState();
        if (cancelled) return;
        if (elevatedState) {
          applyHydrationState(elevatedState);
          // No recovery prompt — this snapshot is being applied immediately,
          // not deferred. Clear any leftover file so we don't double-prompt
          // on the next normal launch.
          return;
        }

        // Case 2: orphan recovery
        const recovery = await readRecoveryState();
        if (cancelled) return;
        if (recovery) {
          setRecoverySnapshot(recovery);
          useUIStore.getState().openElevationRecovery();
        }
      } catch (err) {
        // Never let elevation-startup logic crash the app. Worst case is
        // user loses recovery offer — but the editor still renders. Log
        // so we can diagnose if it ever fires.
        console.error('[elevation startup]', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanupShortcuts = registerKeyboardShortcuts();
    initFileOpenListener();

    let cleanupClose: (() => void) | undefined;
    initWindowCloseGuard().then((fn) => {
      cleanupClose = fn;
    });

    return () => {
      cleanupShortcuts();
      cleanupClose?.();
    };
  }, []);

  useEffect(() => {
    if (loadGeneration === 0) return;

    const opts = useFileStore.getState().lastLoadOptions;
    if (opts.kind === 'load' && opts.resetMode) {
      useUIStore.getState().setMode('view');
    } else if (opts.kind === 'reset') {
      useUIStore.getState().setMode('edit');
    }
  }, [loadGeneration]);

  useEffect(() => {
    const state = useFileStore.getState();
    if (state.filePath !== null || state.isDirty) return;

    const isCurrentlyOnWelcome = Object.values(translations).some(
      (dict) => dict['welcome.doc'] === state.content,
    );
    if (!isCurrentlyOnWelcome) return;

    const newWelcome = translations[language]['welcome.doc'];
    if (newWelcome && newWelcome !== state.content) {
      useFileStore.setState({
        content: newWelcome,
        originalContent: newWelcome,
        isDirty: false,
      });
    }
  }, [language]);

  const isMd = isMarkdown(category);
  const isJsonTree = isStructured(category);
  const effectiveMode = !isMd && mode === 'edit-full' ? 'edit' : mode;
  const isUserEditing = effectiveMode === 'edit' || effectiveMode === 'edit-full';

  /*
   * Callback refs for scroll target. Each scrollable component calls these
   * when it mounts (with the element) and again when it unmounts (with null).
   *
   * This pattern replaces the older "useEffect reads .current" approach,
   * which had a race condition during mode switches: the effect ran before
   * the newly-mounted component's ref was set, so scrollTarget would end
   * up null and never get updated.
   *
   * Using useCallback so the callback identity is stable — the components
   * trigger their internal "tell parent" effect with this same function,
   * not a fresh one on every parent render. Otherwise we'd get notified
   * on every render, even when nothing changed.
   */
  const handleRendererScroller = useCallback((el: HTMLDivElement | null) => {
    setScrollTarget(el);
  }, []);

  const handleEditorScroller = useCallback((el: HTMLElement | null) => {
    setScrollTarget(el);
  }, []);

  const handleJsonViewerScroller = useCallback((el: HTMLDivElement | null) => {
    setScrollTarget(el);
  }, []);

  const handlePreviewScrollerReady = useCallback((el: HTMLDivElement | null) => {
    setScrollTarget(el);
  }, []);

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <TopBar />
      <ReadingProgressBar target={scrollTarget} isEditing={isUserEditing} />

      <main className="relative flex-1 overflow-hidden">
        {/* Markdown branch */}
        {isMd && effectiveMode === 'view' && (
          <Renderer source={content} onScrollerReady={handleRendererScroller} />
        )}
        {isMd && effectiveMode === 'edit' && (
          <SplitView onPreviewScrollerReady={handlePreviewScrollerReady} />
        )}
        {isMd && effectiveMode === 'edit-full' && (
          <Editor
            ref={editorRef}
            showPaneToggle
            isFull
            onScrollerReady={handleEditorScroller}
          />
        )}

        {/* Non-markdown branch */}
        {!isMd && effectiveMode === 'view' && isJsonTree && (
          <JsonTreeViewer source={content} onScrollerReady={handleJsonViewerScroller} />
        )}
        {!isMd && effectiveMode === 'view' && !isJsonTree && (
          <Editor
            ref={editorRef}
            readOnly
            showToolbar={false}
            showFoldControls
            onScrollerReady={handleEditorScroller}
          />
        )}
        {!isMd && effectiveMode === 'edit' && (
          <Editor
            ref={editorRef}
            showToolbar={false}
            showFoldControls
            onScrollerReady={handleEditorScroller}
          />
        )}

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
      <ElevationPromptModal />
      <ElevationUnsupportedModal />
      {recoverySnapshot && <ElevationRecoveryModal snapshot={recoverySnapshot} />}
      <LargeOrBinaryModal />
    </div>
  );
}
