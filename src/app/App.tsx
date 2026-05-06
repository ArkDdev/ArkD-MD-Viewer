import { useEffect } from 'react';
import { TitleBar } from '@/components/chrome/TitleBar';
import { Toolbar } from '@/components/chrome/Toolbar';
import { Renderer } from '@/components/viewer/Renderer';
import { Editor } from '@/components/editor/Editor';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { registerKeyboardShortcuts } from '@/lib/shortcuts';
import { initFileOpenListener } from '@/lib/fs/openHandler';

export function App() {
  const { content, filePath, isDirty } = useFileStore();
  const { mode } = useUIStore();

  useEffect(() => {
    const cleanup = registerKeyboardShortcuts();
    initFileOpenListener();
    return cleanup;
  }, []);

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <TitleBar filePath={filePath} isDirty={isDirty} />
      <Toolbar />

      <main className="relative flex-1 overflow-hidden">
        {mode === 'view' && <Renderer source={content} />}
        {mode === 'edit' && <Editor />}
        {mode === 'split' && (
          <div className="flex h-full">
            <div className="flex-1 border-r border-border">
              <Editor />
            </div>
            <div className="flex-1">
              <Renderer source={content} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
