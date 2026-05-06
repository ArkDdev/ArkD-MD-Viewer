use std::fs;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use tauri::{Emitter, Manager};

mod commands;

/// Holds the file path passed via CLI arguments at startup, if any.
/// Read once by the frontend via `get_initial_file`.
static INITIAL_FILE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Capture initial file argument before Tauri starts
    let args: Vec<String> = std::env::args().collect();
    if let Some(path) = args.iter().skip(1).find(|a| !a.starts_with("--")) {
        if std::path::Path::new(path).is_file() {
            *INITIAL_FILE.lock().unwrap() = Some(path.clone());
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::read_text_file,
            commands::write_text_file,
            commands::get_initial_file,
        ])
        .setup(|app| {
            // macOS-specific: handle "Open with…" while the app is running
            #[cfg(target_os = "macos")]
            {
                let app_handle = app.handle().clone();
                app.listen_any("tauri://file-drop", move |event| {
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
