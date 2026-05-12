import { invoke } from '@tauri-apps/api/core';
import { exit as appExit } from '@tauri-apps/plugin-process';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { detectFileType } from '@/lib/fs/fileType';

/**
 * Elevation flow — saving files that require admin rights.
 *
 * On Windows, when the user tries to save a write-protected file (e.g.
 * `C:\Windows\System32\drivers\etc\hosts`), the OS returns "Access denied".
 * Rather than just failing, we offer to relaunch the app with UAC elevation,
 * carrying the entire app state (open file path, dirty buffer, UI settings)
 * so the user picks up exactly where they left off — only now with rights
 * to save.
 *
 * On macOS and Linux there's no equivalent of UAC for a regular user-launched
 * GUI app, so we show a simpler "please relaunch manually as admin/root"
 * dialog instead.
 *
 * Recovery: if the user accepts the elevation prompt but then declines UAC,
 * the elevated process never starts. The state file we wrote stays in
 * %TEMP%/arkd-md-viewer/. On the *next* normal launch, we detect this
 * orphan and offer to restore the unsaved work.
 */

/**
 * Match strings that strongly suggest a write was rejected for permission
 * reasons. We accept both English error text (default Windows/Linux locale)
 * and Russian (some localised Windows builds). Substring match, case-insensitive.
 *
 * False positives here are mostly harmless — we'd show the elevation prompt
 * when the file was actually unwritable for a different reason. False
 * negatives are worse (user thinks they saved, didn't) — so we keep the
 * list permissive.
 */
const ACCESS_DENIED_HINTS = [
  'access is denied',
  'access denied',
  'permission denied',
  'eacces',
  'eperm',
  'отказано в доступе',
  'нет доступа',
];

export function isAccessDeniedError(err: unknown): boolean {
  const msg = String(err ?? '').toLowerCase();
  return ACCESS_DENIED_HINTS.some((hint) => msg.includes(hint));
}

/**
 * Full snapshot of the data we want to preserve across an elevation restart.
 * Everything reachable by the user (file content, mode, ui settings) is
 * captured so the elevated process can present a visually identical view.
 *
 * NOTE: keep this in sync with `applyHydrationState()` below — anything
 * added here that isn't applied during hydration is dead weight in the
 * state file.
 */
export interface ElevationStateSnapshot {
  version: 1;
  filePath: string | null;
  content: string;
  originalContent: string;
  isDirty: boolean;
  /** Hint for the elevated process: this content is *pending save*. */
  pendingSave: boolean;
  ui: {
    mode: 'view' | 'edit' | 'edit-full';
    language: 'ru' | 'en';
    themeOverride: 'light' | 'dark' | null;
  };
  /** Wallclock timestamp — useful in recovery prompts ("from 2 minutes ago"). */
  createdAt: number;
}

export function buildSnapshot(pendingSave: boolean): ElevationStateSnapshot {
  const f = useFileStore.getState();
  const u = useUIStore.getState();
  return {
    version: 1,
    filePath: f.filePath,
    content: f.content,
    originalContent: f.originalContent,
    isDirty: f.isDirty,
    pendingSave,
    ui: {
      mode: u.mode,
      language: u.language,
      themeOverride: u.themeOverride,
    },
    createdAt: Date.now(),
  };
}

/**
 * Apply a saved snapshot to the current stores. Used both for the elevated
 * relaunch (fresh process picking up where the unelevated one left off) and
 * the recovery flow (next normal launch found an orphan).
 */
export function applyHydrationState(snapshot: ElevationStateSnapshot): void {
  // Restore UI first so the editor mounts with the right mode straight away.
  // setMode/setLanguage/setTheme all dispatch single store updates.
  useUIStore.getState().setLanguage(snapshot.ui.language);
  if (snapshot.ui.themeOverride !== null) {
    useUIStore.getState().setTheme(snapshot.ui.themeOverride);
  }
  useUIStore.getState().setMode(snapshot.ui.mode);

  // Restore file. We bypass the normal loadFile() flow because we already
  // have content in memory — no need to re-read disk (and the elevated
  // process probably can't read it from disk yet either, depending on perms).
  useFileStore.setState({
    filePath: snapshot.filePath,
    content: snapshot.content,
    originalContent: snapshot.originalContent,
    isDirty: snapshot.isDirty,
    category: detectFileType(snapshot.filePath),
    loadGeneration: useFileStore.getState().loadGeneration + 1,
    lastLoadOptions: { kind: 'load' },
  });
}

/**
 * Build a state snapshot, hand it to the Tauri command, and exit the current
 * process. The new (elevated) process will pick up the state on startup.
 *
 * Returns a string describing the failure reason if we couldn't even start
 * the elevation request (e.g. unsupported platform). `null` if elevation
 * was requested successfully — caller should NOT keep running, but the
 * actual exit happens here too as a safety net.
 */
export async function requestElevatedRestart(): Promise<string | null> {
  try {
    const snapshot = buildSnapshot(true);
    await invoke('request_elevated_restart', {
      stateJson: JSON.stringify(snapshot),
    });
    // Give the UAC prompt a moment to surface before we close — otherwise
    // some Windows configurations race and lose focus.
    await new Promise((r) => setTimeout(r, 150));
    await appExit(0);
    return null;
  } catch (err) {
    return String(err ?? 'unknown');
  }
}

/**
 * Returns whether the current OS supports auto-elevation via UAC.
 * Currently true only on Windows. Used at decision-time to pick the right
 * modal (auto-relaunch vs manual instructions).
 *
 * We rely on Tauri's user-agent / navigator.platform sniff rather than a
 * round-trip to Rust — this is purely a UI decision, security-irrelevant.
 */
export function platformSupportsAutoElevation(): boolean {
  if (typeof navigator === 'undefined') return false;
  const p = navigator.platform.toLowerCase();
  return p.includes('win');
}

/** Read the elevated-startup payload (if this process was launched via UAC). */
export async function readElevatedStartupState(): Promise<ElevationStateSnapshot | null> {
  const json = await invoke<string | null>('consume_elevated_startup_state');
  if (!json) return null;
  try {
    return JSON.parse(json) as ElevationStateSnapshot;
  } catch {
    return null;
  }
}

/** Read an orphaned recovery state file (UAC declined on a previous attempt). */
export async function readRecoveryState(): Promise<ElevationStateSnapshot | null> {
  const json = await invoke<string | null>('consume_elevation_recovery_state');
  if (!json) return null;
  try {
    return JSON.parse(json) as ElevationStateSnapshot;
  } catch {
    return null;
  }
}

/** Best-effort cleanup of the state file (e.g. user dismissed recovery). */
export async function clearElevationStateFile(): Promise<void> {
  try {
    await invoke('clear_elevation_state');
  } catch {
    /* ignore — leftover state will just trigger recovery again, that's fine */
  }
}

/** Is the current process running as admin/root? */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    return await invoke<boolean>('is_admin');
  } catch {
    return false;
  }
}
