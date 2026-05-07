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
