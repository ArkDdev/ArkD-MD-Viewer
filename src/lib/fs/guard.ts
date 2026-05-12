import { useFileStore } from '@/store/fileStore';
import { saveFileAs } from '@/lib/fs/files';
import { saveWithElevationFallback } from '@/lib/fs/saveWithElevation';
import { confirmDiscard } from '@/lib/unsavedGuard';

/**
 * Wrap any destructive action (one that would lose the current dirty buffer)
 * with the unsaved-changes guard.
 *
 * Returns true  → caller should proceed with the destructive action
 * Returns false → caller should abort (user picked Cancel, or Save was
 *                 cancelled mid-flow because they cancelled the Save As dialog,
 *                 or elevation was requested but not yet completed)
 *
 * Note on elevation: if saving requires admin rights, `saveWithElevationFallback`
 * surfaces the elevation prompt and returns 'elevation-requested'. We treat
 * that as "save did not complete", so the destructive action is aborted —
 * the user needs to wait for the relaunch (or cancel) and then retry.
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
      const result = await saveWithElevationFallback(state.filePath, state.content);
      if (result === 'saved') {
        useFileStore.getState().markSaved();
        return true;
      }
      // Elevation requested — save not complete yet. Abort destructive action.
      return false;
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
