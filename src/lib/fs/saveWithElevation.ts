import { saveFile } from '@/lib/fs/files';
import { useUIStore } from '@/store/uiStore';
import { isAccessDeniedError, platformSupportsAutoElevation } from '@/lib/elevation/elevation';

/**
 * Wraps a plain saveFile call with the elevation-prompt fallback.
 *
 * Behaviour:
 *   - Try the save normally.
 *   - On success: return `'saved'`.
 *   - On "Access denied"–style failure:
 *       - Windows: open the auto-elevation modal (offers UAC relaunch).
 *       - macOS/Linux: open the manual-elevation modal (suggests Save As
 *         or relaunch as admin/root).
 *     Return `'elevation-requested'` so the caller doesn't fall into its
 *     usual error-handler path.
 *   - On any other failure: rethrow.
 *
 * Why a wrapper instead of putting the catch into saveFile() directly:
 * the elevation prompt mutates UI state (opens a modal), which doesn't
 * belong in the low-level fs helper. Keeping it here keeps `files.ts`
 * unaware of UI concerns.
 */
export async function saveWithElevationFallback(
  path: string,
  content: string,
): Promise<'saved' | 'elevation-requested'> {
  try {
    await saveFile(path, content);
    return 'saved';
  } catch (err) {
    if (isAccessDeniedError(err)) {
      const ui = useUIStore.getState();
      if (platformSupportsAutoElevation()) {
        ui.openElevationPrompt();
      } else {
        ui.openElevationUnsupported();
      }
      return 'elevation-requested';
    }
    throw err;
  }
}
