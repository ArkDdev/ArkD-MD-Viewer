import { useFileStore } from '@/store/fileStore';
import { saveFile, saveFileAs } from '@/lib/fs/files';
import { confirmDiscard } from '@/lib/unsavedGuard';

/**
 * Wrap any destructive action (one that would lose the current dirty buffer)
 * with the unsaved-changes guard.
 *
 * Returns true  → caller should proceed with the destructive action
 * Returns false → caller should abort (user picked Cancel, or Save was
 *                 cancelled mid-flow because they cancelled the Save As dialog)
 *
 * Usage:
 *
 *   const handleNew = async () => {
 *     if (!(await guardDirtyBuffer())) return;
 *     useFileStore.getState().reset();
 *     // ... rest of "new file" flow
 *   };
 *
 * The "save" branch handles both cases:
 *   - File has a path     → write to it directly
 *   - File has no path    → show Save As dialog; if user cancels there,
 *                           we treat it as Cancel for the whole guard
 */
export async function guardDirtyBuffer(): Promise<boolean> {
  const state = useFileStore.getState();
  if (!state.isDirty) return true; // nothing to lose

  const choice = await confirmDiscard();

  if (choice === 'cancel') return false;
  if (choice === 'discard') return true;

  // choice === 'save'
  if (state.filePath) {
    try {
      await saveFile(state.filePath, state.content);
      useFileStore.getState().markSaved();
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    }
  } else {
    // No path yet — needs a Save As dialog
    const newPath = await saveFileAs(state.content);
    if (!newPath) return false; // user cancelled the Save As dialog
    useFileStore.getState().loadFile(newPath, state.content);
    return true;
  }
}
