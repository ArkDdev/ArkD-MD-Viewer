use crate::{read_file_to_string, take_initial_file, write_string_to_file};

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    read_file_to_string(&path)
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    write_string_to_file(&path, &content)
}

/// Returns the file path the app was launched with (if any), then clears it.
/// Subsequent calls return None.
#[tauri::command]
pub fn get_initial_file() -> Option<String> {
    take_initial_file()
}
