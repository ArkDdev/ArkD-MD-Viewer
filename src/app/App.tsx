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

export function App() {
  const content = useFileStore((s) => s.content);
  const mode = useUIStore((s) => s.mode);
  const editorRef = useRef<EditorHandle>(null);

  const dragState = useDragAndDrop();
  const { conflict, reload, keepLocal } = useFileWatcher();

  useEffect(() => {
    const cleanup = registerKeyboardShortcuts();
    initFileOpenListener();
    return cleanup;
  }, []);

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
