use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

use crate::watcher::WatcherState;
use crate::{read_file_to_string, take_initial_file, write_string_to_file};

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    read_file_to_string(&path)
}

/// Write a file. If a watcher is active on this same path, pause it before
/// the write and resume it after a short delay so our own write doesn't
/// trigger a `file-changed` event back to the UI.
///
/// The 300ms delay is intentionally longer than the watcher's 200ms debounce
/// so that any FS events caused by our write have already been collapsed
/// into a single (dropped) notification before we re-enable.
#[tauri::command]
pub async fn write_text_file(path: String, content: String, app: AppHandle) -> Result<(), String> {
    // Check if this path is being watched, and pause if so
    let is_watched = {
        let watcher_state = app.state::<Mutex<WatcherState>>();
        let w = watcher_state.lock().unwrap();
        w.watched_path()
            .map(|p| p == PathBuf::from(&path))
            .unwrap_or(false)
    };

    if is_watched {
        let watcher_state = app.state::<Mutex<WatcherState>>();
        watcher_state.lock().unwrap().pause();
    }

    let result = write_string_to_file(&path, &content);

    if is_watched {
        // Use Tauri's async runtime to schedule the resume
        let app_handle = app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(300)).await;
            let watcher_state = app_handle.state::<Mutex<WatcherState>>();
            watcher_state.lock().unwrap().resume();
        });
    }

    result
}

#[tauri::command]
pub fn get_initial_file() -> Option<String> {
    take_initial_file()
}

#[tauri::command]
pub fn start_watching(
    path: String,
    app: AppHandle,
    watcher: State<'_, Mutex<WatcherState>>,
) -> Result<(), String> {
    watcher.lock().unwrap().start(app, PathBuf::from(path))
}

#[tauri::command]
pub fn stop_watching(watcher: State<'_, Mutex<WatcherState>>) -> Result<(), String> {
    watcher.lock().unwrap().stop();
    Ok(())
}

// ── Elevation commands ────────────────────────────────────────────────

/// Returns `true` if the current process is running with admin/root rights.
/// Frontend uses this to show the "Administrator" indicator.
#[tauri::command]
pub fn is_admin() -> bool {
    crate::elevation::is_elevated()
}

/// Write a JSON state blob to %TEMP%/arkd-md-viewer/elevation-state.json
/// and immediately request UAC elevation. On success the new admin process
/// will be launched in the background; this one is expected to exit shortly
/// after (the frontend calls `app.exit(0)` or equivalent).
///
/// Returns `Ok(())` on success — meaning the elevation request was issued.
/// Note: this does NOT guarantee the user accepted UAC; that resolution
/// happens out-of-band. If user cancels, the elevated process never starts
/// and the state file stays for recovery on next normal launch.
///
/// Returns `Err("user_cancelled_uac")` if Windows reported the user declined
/// directly (some configurations surface this synchronously).
///
/// Returns `Err("elevation_not_supported_on_this_platform")` on macOS/Linux —
/// frontend uses this string to show the manual-relaunch hint.
#[tauri::command]
pub fn request_elevated_restart(state_json: String) -> Result<(), String> {
    let state_path = crate::elevation::write_state_file(&state_json)?;
    crate::elevation::request_elevation(&state_path)
}

/// On startup, if we were launched via `--elevated-startup`, return the
/// serialised state JSON so the frontend can restore the editor exactly
/// as it was before elevation.
#[tauri::command]
pub fn consume_elevated_startup_state() -> Option<String> {
    crate::elevation::consume_elevated_state()
}

/// Check whether a leftover elevation-state file exists from a previous
/// abandoned attempt (UAC declined, crash, etc.). Returns the JSON content
/// if found, and removes the file. Returns `None` otherwise. Frontend
/// calls this once on startup and offers recovery if the result is `Some`.
#[tauri::command]
pub fn consume_elevation_recovery_state() -> Option<String> {
    let state = crate::elevation::consume_recovery_state();
    if state.is_some() {
        crate::elevation::clear_state_file();
    }
    state
}

/// Manual cleanup hook for the frontend (e.g. user dismisses recovery
/// prompt with "Discard"). Idempotent.
#[tauri::command]
pub fn clear_elevation_state() -> Result<(), String> {
    crate::elevation::clear_state_file();
    Ok(())
}
