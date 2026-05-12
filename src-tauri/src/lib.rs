use std::fs;
use std::sync::Mutex;
use once_cell::sync::Lazy;

// `Manager` brings `get_webview_window` into scope; we only use it in the
// debug-only setup block below, so the import is gated on the same cfg.
#[cfg(debug_assertions)]
use tauri::Manager;

#[cfg(target_os = "macos")]
use tauri::{Emitter, Manager as _};

mod commands;
mod elevation;
mod watcher;

use watcher::WatcherState;

static INITIAL_FILE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Capture initial file argument before Tauri starts.
    // Also detect `--elevated-startup` (this process was relaunched with
    // admin rights and should restore prior state) vs an orphaned state
    // file from a previously abandoned elevation attempt.
    let args: Vec<String> = std::env::args().collect();
    elevation::check_startup_args(&args);

    // Skip file-arg detection if this is an elevated-restart launch — the
    // state file will tell us which file to open, and we don't want to also
    // re-open whatever the launcher passed in argv.
    let is_elevated_restart = args.iter().any(|a| a == "--elevated-startup");
    if !is_elevated_restart {
        if let Some(path) = args
            .iter()
            .skip(1)
            .find(|a| !a.starts_with("--") && !a.starts_with("-"))
        {
            if std::path::Path::new(path).is_file() {
                *INITIAL_FILE.lock().unwrap() = Some(path.clone());
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .manage(Mutex::new(WatcherState::new()))
        .invoke_handler(tauri::generate_handler![
            commands::read_text_file,
            commands::probe_file,
            commands::write_text_file,
            commands::get_initial_file,
            commands::start_watching,
            commands::stop_watching,
            commands::is_admin,
            commands::request_elevated_restart,
            commands::consume_elevated_startup_state,
            commands::consume_elevation_recovery_state,
            commands::clear_elevation_state,
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = _app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            #[cfg(target_os = "macos")]
            {
                let app_handle = _app.handle().clone();
                _app.listen_any("tauri://file-drop", move |event| {
                    let _ = app_handle.emit("file-open", event.payload());
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ArkD. MD Viewer");
}

pub(crate) fn take_initial_file() -> Option<String> {
    INITIAL_FILE.lock().unwrap().take()
}

pub(crate) fn read_file_to_string(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

pub(crate) fn write_string_to_file(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}
