import { useEffect, useRef } from 'react';
import { TopBar } from '@/components/chrome/TopBar';
import { SettingsModal } from '@/components/chrome/SettingsModal';
import { DisplayModal } from '@/components/chrome/DisplayModal';
import { DragOverlay } from '@/components/chrome/DragOverlay';
import { ConflictModal } from '@/components/chrome/ConflictModal';
import { Renderer } from '@/components/viewer/Renderer';
import { SplitView } from '@/components/viewer/SplitView';
import { Editor, type EditorHandle } from '@/components/editor/Editor';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { registerKeyboardShortcuts } from '@/lib/shortcuts';
import { initFileOpenListener } from '@/lib/fs/openHandler';
import { useDragAndDrop } from '@/lib/fs/dragDrop';
import { useFileWatcher } from '@/lib/fs/fileWatcher';
import { translations } from '@/lib/i18n/translations';

export function App() {
  const content = useFileStore((s) => s.content);
  const mode = useUIStore((s) => s.mode);
  const language = useUIStore((s) => s.language);
  const editorRef = useRef<EditorHandle>(null);

  const dragState = useDragAndDrop();
  const { conflict, reload, keepLocal } = useFileWatcher();

  useEffect(() => {
    const cleanup = registerKeyboardShortcuts();
    initFileOpenListener();
    return cleanup;
  }, []);

  /*
   * Live-translate the welcome doc when language changes.
   * If the user is currently looking at one of the welcome docs (any language)
   * with a clean buffer and no file open, swap it for the version in the new
   * language. We compare against ALL known welcome strings, so this works even
   * after multiple language switches.
   *
   * Skipped when:
   *   - a real file is open (filePath !== null)
   *   - the buffer is dirty (user has typed something)
   *   - the current content is custom text typed from the New File state
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
      // Use loadFile to also reset originalContent so isDirty stays false
      useFileStore.getState().loadFile('', newWelcome);
      // ...but loadFile sets a path; reset() would clear it. Use a manual reset:
      useFileStore.setState({
        filePath: null,
        content: newWelcome,
        originalContent: newWelcome,
        isDirty: false,
      });
    }
  }, [language]);

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <TopBar />

      <main className="relative flex-1 overflow-hidden">
        {mode === 'view' && <Renderer source={content} />}
        {mode === 'edit' && <SplitView />}
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
    </div>
  );
}
